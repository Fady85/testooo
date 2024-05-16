# Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
class ContractorInvoice(Document):

	# get last doc from database and if not exist return None
	@frappe.whitelist()
	def contractor_number(self):
		try:
			doc = frappe.get_last_doc('Contractor Invoice',
					filters={
						"contractor": self.contractor,
						"project": self.project,
						"docstatus": 1
					},
					order_by="invoice_number desc"
				);
			return doc;
		except Exception as error :
			return None;

	@frappe.whitelist()
	def contractor_payments(self):
		payments = frappe.db.get_list('Payment Entry', 
				filters={
				"party": self.contractor,
				"project": self.project
			},
			fields=["name", "posting_date", "paid_from", "bank_account", "paid_amount", "paid_from_account_currency"]
		);

		return payments;


	@frappe.whitelist()
	def contractor_cost_center(self):
		# projectDoc = frappe.get_doc("Project", self.project);
		projectCostCenter = frappe.db.get_value('Project', str(self.project), 'cost_center');
		self.cost_center = projectCostCenter
		return ;
	
	@frappe.whitelist()
	def get_exchang_rate(self):
		defaultCurrency = frappe.db.get_value('Company', self.company, 'default_currency');
		exchangeRate = frappe.db.get_value('Currency Exchange', {'from_currency': self.currency, "to_currency": defaultCurrency}, "exchange_rate")
		return exchangeRate;
		
	# set Invoice amount value with the diffrence between last doc amount and current one
	def before_save(self):
		contractorAccountCurrency = frappe.db.get_value('Account', self.contractor_account, 'account_currency');
		workAccountCurrency = frappe.db.get_value('Account', self.contractor_account, 'account_currency');
		if(contractorAccountCurrency != self.currency):
			frappe.throw(f"contractor account currency ({contractorAccountCurrency}) and document currency ({self.currency}) must be the same")
		if(workAccountCurrency != self.currency):
			frappe.throw(f"work account currency ({workAccountCurrency}) and document currency ({self.currency}) must be the same")

		if(self.invoice_number != 1):
			lastDoc = frappe.get_last_doc('Contractor Invoice', filters={
							"contractor": self.contractor,
							"project": self.project,
							"docstatus": 1
						}, order_by="invoice_number desc");

			diffValue = float(self.net_total) - float(lastDoc.net_total);
			self.invoice_amount = diffValue;
		else:
			self.invoice_amount = self.net_total;
		

	def before_submit(self):
		def create_gl_entry():
			defaultCurrency = frappe.db.get_value('Company', self.company, 'default_currency');
			work_account = self.work_account;
			amount = self.net_total;
			voucher_type = self.doctype
			voucher_number = self.name;
			party = self.contractor;
			party_type = "Supplier";
			contractor_account = self.contractor_account;
			project = self.project;
			cost_center = self.cost_center;
			company = self.company
			day = frappe.utils.today();
			prevNumber = 0
			if self.invoice_number != 1:
				lastDoc = frappe.get_last_doc('Contractor Invoice', filters={
						"contractor":party,
						"project": project,
						"docstatus": 1
						}, order_by="invoice_number desc");
				prevNumber = lastDoc.net_total
			
			currentNumber = int(amount) - int(prevNumber)
			firstDoc = frappe.new_doc('GL Entry')
			secondDoc = frappe.new_doc('GL Entry')
			
			firstDoc.account = work_account if currentNumber > 0 else contractor_account
			firstDoc.posting_date = frappe.utils.today()
			firstDoc.account_currency= "EGP"
			firstDoc.against= party if currentNumber > 0 else work_account
			firstDoc.debit= abs(currentNumber)
			firstDoc.debit_in_account_currency= abs(currentNumber) if self.currency == defaultCurrency else self.net_total_invoice_currency 
			firstDoc.credit=0
			firstDoc.credit_in_account_currency=0 
			firstDoc.voucher_type= voucher_type
			firstDoc.voucher_no= voucher_number
			firstDoc.party_type = "Supplier"
			firstDoc.party = party
			firstDoc.project = project
			firstDoc.cost_center = cost_center
			
			secondDoc.account = contractor_account if currentNumber > 0 else work_account
			secondDoc.posting_date = frappe.utils.today()
			secondDoc.account_currency= "EGP"
			secondDoc.against= work_account if currentNumber > 0 else party
			secondDoc.debit= 0
			secondDoc.debit_in_account_currency= 0
			secondDoc.credit= abs(currentNumber)
			secondDoc.credit_in_account_currency= abs(currentNumber) if self.currency == defaultCurrency else self.net_total_invoice_currency 
			secondDoc.voucher_type= voucher_type
			secondDoc.voucher_no= voucher_number
			secondDoc.party_type = "Supplier"
			secondDoc.party = party
			secondDoc.project = project
			secondDoc.cost_center = cost_center
			
			
			firstDoc.insert(ignore_permissions=True)
			secondDoc.insert(ignore_permissions=True)

		create_gl_entry()

		if(self.invoice_number == 1):
			new_accumulated_Invoice = frappe.get_doc({
				"doctype": "Accumulated Invoice",
				"invoice_number":self.invoice_number,
				"contractor": self.contractor,
				"transaction_date": self.transaction_date,
				"company" : self.company ,
				"cost_center" : self.cost_center ,
				"project" : self.project ,
				"currency": self.currency,
				"exchange_rate": self.exchange_rate,
				"items" : self.items ,
				"discount" : self.discount ,
				"insurance" : self.insurance ,
				"due_amount" : self.due_amount ,
				"subtotal" : self.subtotal ,
				"grand_total" : self.grand_total ,
				"net_total" : self.net_total ,
				"net_total_invoice_currency": self.net_total_invoice_currency,
				"invoice_amount" : self.invoice_amount ,
				"discount_percentage" : self.discount_percentage ,
				"discount_amount" : self.discount_amount ,
				"discount_total" : self.discount_total ,
				"discount_percentage_amount" : self.discount_percentage_amount ,
				"discount_description" : self.discount_description ,
				"insurance_percentage" : self.insurance_percentage ,
				"insurance_amount" : self.insurance_amount ,
				"insurance_total" : self.insurance_total ,
				"insurance_percentage_amount" : self.insurance_percentage_amount ,
				"total_payments" : self.total_payments ,
				"payments_list" : self.payments_list ,
				"contractor_account" : self.contractor_account ,
				"work_account" : self.work_account 
			})
			
			for item in self.items:
				new_accumulated_Invoice.append("acc_items", {
					"item_code": item.item_code,
					"description": item.description,
					"uom":item.uom,
					"previous": item.previous,
					"current": item.current,
					"accepted_qty": item.accepted_qty,
					"rate":item.rate,
					"subtotal":item.subtotal,
					"percentage":item.percentage,
					"grand_total":item.grand_total
				});
			
			if(len(self.payments_list)):
				for item in self.payments_list:
					new_accumulated_Invoice.append("acc_items", {
						"payment_id": item.payment_id,
						"date": item.date,
						"pay_account":item.pay_account,
						"bank_account": item.bank_account,
						"amount": item.amount,
						"currency": item.currency,
					});
			new_accumulated_Invoice.insert();
		else:
			total_doc = frappe.get_last_doc(
				"Accumulated Invoice",
				filters={
					"contractor": self.contractor,
					"project":self.project
					})
			if(total_doc):
				total_doc.invoice_number = self.invoice_number;
				total_doc.contractor = self.contractor;
				total_doc.transaction_date = self.transaction_date;
				total_doc.company = self.company;
				total_doc.currency = self.currency;
				total_doc.exchange_rate = self.exchange_rate;
				total_doc.items = self.items;
				total_doc.discount = self.discount;
				total_doc.insurance = self.insurance;
				total_doc.due_amount = self.due_amount;
				total_doc.subtotal = self.subtotal;
				total_doc.grand_total = self.grand_total;
				total_doc.net_total = self.net_total;
				total_doc.net_total_invoice_currency = self.net_total_invoice_currency
				total_doc.invoice_amount = self.invoice_amount;
				total_doc.discount_percentage = self.discount_percentage;
				total_doc.discount_amount = self.discount_amount;
				total_doc.discount_total = self.discount_total;
				total_doc.discount_percentage_amount = self.discount_percentage_amount;
				total_doc.discount_description = self.discount_description;
				total_doc.insurance_percentage = self.insurance_percentage;
				total_doc.insurance_amount = self.insurance_amount;
				total_doc.insurance_total = self.insurance_total;
				total_doc.insurance_percentage_amount = self.insurance_percentage_amount;
				total_doc.total_payments = self.total_payments;
				total_doc.contractor_account = self.contractor_account;
				total_doc.work_account = self.work_account;

				total_doc.set("acc_items", [])
				total_doc.set("payments_list", [])

				for item in self.items:
					total_doc.append("acc_items", {
						"item_code": item.item_code,
						"description": item.description,
						"uom":item.uom,
						"previous": item.previous,
						"current": item.current,
						"accepted_qty": item.accepted_qty,
						"rate":item.rate,
						"subtotal":item.subtotal,
						"percentage":item.percentage,
						"grand_total":item.grand_total
						});
			
				if(len(self.payments_list)):
					for item in self.payments_list:
						total_doc.append("acc_items", {
							"payment_id": item.payment_id,
							"date": item.date,
							"pay_account":item.pay_account,
							"bank_account": item.bank_account,
							"amount": item.amount,
							"currency": item.currency,
				});
				total_doc.save();

	def before_cancel(self):
		# frappe.db.delete("Invoice Item")
		# frappe.throw(str(frappe.db.get_value('Company', self.company, 'default_currency')))
  		# frappe.throw(str(frappe.db.get_list("Invoice Item", fields="*")))

		entriesList = frappe.db.get_list('GL Entry',
						filters={
							"voucher_type": self.doctype,
							"voucher_no": self.name
						}
					)

		for docName in entriesList :
			entryDoc = frappe.get_doc("GL Entry", docName.name)
			frappe.db.set_value('GL Entry', docName.name, 'is_cancelled', 1)
			if(entryDoc.debit):
				frappe.db.set_value('GL Entry', docName.name, {
					'credit': entryDoc.debit,
					'credit_in_account_currency':entryDoc.debit_in_account_currency
				})
			elif (entryDoc.credit):
				frappe.db.set_value('GL Entry', docName.name, {
					'debit': entryDoc.credit,
					'debit_in_account_currency':entryDoc.credit_in_account_currency
				})

	def on_trash(self):
			frappe.db.delete("GL Entry", {
			"voucher_type": self.doctype,
			"voucher_no": self.name
		})	