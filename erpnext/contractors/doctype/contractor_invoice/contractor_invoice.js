// Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on("Contractor Invoice", {
	refresh(frm) {
		if (frm.doc.docstatus > 0) {
			frm.add_custom_button(
				"Accounting Ledger",
				function () {
					frappe.route_options = {
						voucher_no: frm.doc.name,
						from_date: frm.doc.posting_date,
						to_date: moment(frm.doc.modified).format("YYYY-MM-DD"),
						company: frm.doc.company,
						group_by: "Group by Voucher (Consolidated)",
						show_cancelled_entries: frm.doc.docstatus === 2,
					};
					frappe.set_route("query-report", "General Ledger");
				},
				"View"
			);
			frm.add_custom_button(
				"New Invoice",
				function () {
					const newDoc = frappe.model.get_new_doc("Contractor Invoice");
					newDoc.contractor = frm.doc.contractor;
					newDoc.project = frm.doc.project;
					newDoc.contractor_account = frm.doc.contractor_account;
					newDoc.work_account = frm.doc.work_account;
					newDoc.supplier_group = frm.doc.supplier_group;
					frappe.set_route("Form", newDoc.doctype, newDoc.name);
				},
				"Create"
			);

			frm.add_custom_button(
				"Payment",
				function () {
					// const newDoc = frappe.model.get_new_doc('Payment Entry');
					// newDoc.naming_series = "ACC-PAY-.YYYY.-"
					// newDoc.posting_date = new Date().toLocaleDateString('en-GB').replaceAll("/", "-");
					// newDoc.payment_type = "Pay";
					// newDoc.party_type = "Supplier";
					// newDoc.party = frm.doc.contractor;
					// newDoc.party_name = frm.doc.contractor;
					// newDoc.paid_to = "2/01/04/007 - Contractors - Cltd";
					// newDoc.project = frm.doc.project;
					// newDoc.cost_center = frm.doc.cost_center;
					const newDoc = frappe.new_doc("Payment Entry", {
						payment_type: "Pay",
						party_type: "Supplier",
						party: frm.doc.contractor,
						party_name: frm.doc.contractor,
						paid_to: frm.doc.contractor_account,
						project: frm.doc.project,
						cost_center: frm.doc.cost_center,
					});

					frappe.set_route("Form", newDoc.doctype, newDoc.name);
				},
				"Create"
			);
		}
	},
	// to be changed

	onload(frm) {
		// frm.set_query("contractor", () => {
		// 	return {
		// 		filters: {
		// 			custom_group_parent: "Contractors",
		// 		},
		// 	};
		// });
		frm.set_query("contractor_account", () => {
			return {
				filters: {
					is_group: 0,
				},
			};
		});
		frm.set_query("work_account", () => {
			return {
				filters: {
					is_group: 0,
				},
			};
		});
		frm.set_query("contractor", () => {
			return {
				filters: {
					custom_is_contractor: 1,
				},
			};
		});
	},
	contractor(frm) {
		if (frm.doc.contractor && frm.doc.project) {
			// get last doc from backend and set it's values to the fields
			frm.call({
				doc: frm.doc,
				method: "contractor_number",
				freeze: true,
				callback: (response) => {
					if (response.message) {
						let prevDoc = response.message;
						frm.clear_table("items");
						frm.set_value("invoice_number", prevDoc.invoice_number + 1);
						prevDoc.items.forEach((item) => {
							let row = frm.add_child("items");
							row.item_code = item.item_code;
							row.description = item.description;
							row.uom = item.uom;
							row.previous = item.previous + item.current;
							row.current = 0;
							row.accepted_qty = item.accepted_qty;
							row.rate = item.rate;
							row.subtotal = item.subtotal;
							row.percentage = item.percentage;
							row.grand_total = item.grand_total;
						});
						frm.refresh_field("items");
						let total = 0;
						frm.doc.items.forEach((item) => {
							total += item.grand_total;
						});
						frm.set_value("discount", prevDoc.discount);
						frm.set_value("insurance", prevDoc.insurance);
						frm.set_value("subtotal", prevDoc.subtotal);
						frm.set_value("grand_total", prevDoc.grand_total);
						frm.set_value("net_total", prevDoc.net_total);
						frm.set_value("discount_percentage", prevDoc.discount_percentage);
						frm.set_value("discount_amount", prevDoc.discount_amount);
						frm.set_value("discount_total", prevDoc.discount_total);
						frm.set_value("discount_percentage_amount", prevDoc.discount_percentage_amount);
						frm.set_value("discount_description", prevDoc.discount_description);
						frm.set_value("insurance_percentage", prevDoc.insurance_percentage);
						frm.set_value("insurance_amount", prevDoc.insurance_amount);
						frm.set_value("insurance_total", prevDoc.insurance_total);
						frm.set_value("insurance_percentage_amount", prevDoc.insurance_percentage_amount);
						frm.set_value("contractor_account", prevDoc.contractor_account);
						frm.set_value("work_account", prevDoc.work_account);
					} else {
						frm.set_value("items", []);
						frm.set_value("invoice_number", 1);
						frm.set_value("discount", 0);
						frm.set_value("insurance", 0);
						frm.set_value("subtotal", 0);
						frm.set_value("grand_total", 0);
						frm.set_value("net_total", 0);
						frm.set_value("discount_percentage", 0);
						frm.set_value("discount_amount", 0);
						frm.set_value("discount_total", 0);
						frm.set_value("discount_percentage_amount", 0);
						frm.set_value("discount_description", "");
						frm.set_value("insurance_percentage", 0);
						frm.set_value("insurance_amount", 0);
						frm.set_value("insurance_total", 0);
						frm.set_value("insurance_percentage_amount", 0);
					}
					frm.call({
						doc: frm.doc,
						method: "contractor_payments",
						callback: function (response) {
							if (response.message.length) {
								frm.clear_table("payments_list");
								response.message.forEach((item) => {
									let row = frm.add_child("payments_list");
									row.payment_id = item.name;
									row.date = item.posting_date;
									row.pay_account = item.paid_from;
									row.bank_account = item.bank_account;
									row.amount = item.paid_amount;
									row.currency = item.paid_from_account_currency;
								});
								let paymentsTable = frm.doc.payments_list;
								let totalPayments = 0;
								paymentsTable.forEach((item) => {
									if (item.amount) {
										totalPayments += item.amount;
									}
								});
								frm.set_value("total_payments", parseInt(totalPayments));
								frm.refresh_field("total_payments");
								frm.refresh_field("payments_list");
							} else {
								frm.set_value("payments_list", []);
								frm.set_value("total_payments", 0);
								frm.refresh_field("total_payments");
								frm.refresh_field("payments_list");
							}
						},
					});
				},
			});
		}
		frm.call({
			doc: frm.doc,
			method: "get_contractorGroup_workAccount",
		});
	},
	project(frm) {
		if (frm.doc.contractor && frm.doc.project) {
			// get last doc from backend and set it's values to the fields
			frm.call({
				doc: frm.doc,
				method: "contractor_number",
				freeze: true,
				callback: (response) => {
					if (response.message) {
						let prevDoc = response.message;
						frm.clear_table("items");
						frm.set_value("invoice_number", prevDoc.invoice_number + 1);
						prevDoc.items.forEach((item) => {
							let row = frm.add_child("items");
							row.item_code = item.item_code;
							row.description = item.description;
							row.uom = item.uom;
							row.previous = item.previous + item.current;
							row.current = 0;
							row.accepted_qty = item.accepted_qty;
							row.rate = item.rate;
							row.subtotal = item.subtotal;
							row.percentage = item.percentage;
							row.grand_total = item.grand_total;
						});
						frm.refresh_field("items");
						let total = 0;
						frm.doc.items.forEach((item) => {
							total += item.grand_total;
						});
						frm.set_value("discount", prevDoc.discount);
						frm.set_value("insurance", prevDoc.insurance);
						frm.set_value("subtotal", prevDoc.subtotal);
						frm.set_value("grand_total", prevDoc.grand_total);
						frm.set_value("net_total", prevDoc.net_total);
						frm.set_value("discount_percentage", prevDoc.discount_percentage);
						frm.set_value("discount_amount", prevDoc.discount_amount);
						frm.set_value("discount_total", prevDoc.discount_total);
						frm.set_value("discount_percentage_amount", prevDoc.discount_percentage_amount);
						frm.set_value("discount_description", prevDoc.discount_description);
						frm.set_value("insurance_percentage", prevDoc.insurance_percentage);
						frm.set_value("insurance_amount", prevDoc.insurance_amount);
						frm.set_value("insurance_total", prevDoc.insurance_total);
						frm.set_value("insurance_percentage_amount", prevDoc.insurance_percentage_amount);
						frm.set_value("contractor_account", prevDoc.contractor_account);
						frm.set_value("work_account", prevDoc.work_account);
					} else {
						frm.set_value("items", []);
						frm.set_value("invoice_number", 1);
						frm.set_value("discount", 0);
						frm.set_value("insurance", 0);
						frm.set_value("subtotal", 0);
						frm.set_value("grand_total", 0);
						frm.set_value("net_total", 0);
						frm.set_value("discount_percentage", 0);
						frm.set_value("discount_amount", 0);
						frm.set_value("discount_total", 0);
						frm.set_value("discount_percentage_amount", 0);
						frm.set_value("discount_description", "");
						frm.set_value("insurance_percentage", 0);
						frm.set_value("insurance_amount", 0);
						frm.set_value("insurance_total", 0);
						frm.set_value("insurance_percentage_amount", 0);
					}
					frm.call({
						doc: frm.doc,
						method: "contractor_payments",
						callback: function (response) {
							if (response.message.length) {
								frm.clear_table("payments_list");
								response.message.forEach((item) => {
									let row = frm.add_child("payments_list");
									row.payment_id = item.name;
									row.date = item.posting_date;
									row.pay_account = item.paid_from;
									row.bank_account = item.bank_account;
									row.amount = item.paid_amount;
									row.currency = item.paid_from_account_currency;
								});
								let paymentsTable = frm.doc.payments_list;
								let totalPayments = 0;
								paymentsTable.forEach((item) => {
									if (item.amount) {
										totalPayments += item.amount;
									}
								});
								frm.set_value("total_payments", parseInt(totalPayments));
								frm.refresh_field("payments_list");
							} else {
								frm.set_value("total_payments", 0);
								frm.set_value("payments_list", []);
							}
							frappe.call({
								doc: frm.doc,
								method: "contractor_cost_center",
								callback: (response) => {
									frm.refresh_field("cost_center");
								},
							});
						},
					});
				},
			});
		}
	},
	currency(frm) {
		frappe.call({
			doc: frm.doc,
			method: "get_exchang_rate",
			callback: (response) => {
				if (response.message) {
					frm.set_value("exchange_rate", response.message);
					frm.refresh();
				} else {
					frm.set_value("exchange_rate", 0);
					frm.refresh();
				}
			},
		});
	},
	exchange_rate(frm) {
		frm.set_value("net_total_invoice_currency", frm.doc.net_total * frm.doc.exchange_rate);
	},

	// start primary caculations

	discount_percentage(frm) {
		frm.set_value(
			"discount_percentage_amount",
			frm.doc.grand_total * (frm.doc.discount_percentage / 100)
		);
	},
	discount_percentage_amount(frm) {
		let discountPercAmount = frm.doc.discount_percentage_amount;
		let discountAmount = frm.doc.discount_amount;
		frm.set_value("discount_total", discountPercAmount + discountAmount);
	},
	discount_amount(frm) {
		let discountPercAmount = frm.doc.discount_percentage_amount;
		let discountAmount = frm.doc.discount_amount;
		frm.set_value("discount_total", discountPercAmount + discountAmount);
	},
	discount_total(frm) {
		frm.set_value("net_total", frm.doc.grand_total - frm.doc.discount_total - frm.doc.insurance_total);
		frm.set_value("discount", frm.doc.discount_total);
	},
	insurance_percentage(frm) {
		frm.set_value(
			"insurance_percentage_amount",
			frm.doc.grand_total * (frm.doc.insurance_percentage / 100)
		);
	},
	insurance_percentage_amount(frm) {
		let insurancePercAmount = frm.doc.insurance_percentage_amount;
		let insuranceAmount = frm.doc.insurance_amount;
		frm.set_value("insurance_total", insurancePercAmount + insuranceAmount);
	},
	insurance_amount(frm) {
		let insurancePercAmount = frm.doc.insurance_percentage_amount;
		let insuranceAmount = frm.doc.insurance_amount;
		frm.set_value("insurance_total", insurancePercAmount + insuranceAmount);
	},
	insurance_total(frm) {
		frm.set_value("net_total", frm.doc.grand_total - frm.doc.discount_total - frm.doc.insurance_total);
		frm.set_value("insurance", frm.doc.insurance_total);
	},
	net_total(frm) {
		frm.set_value("due_amount", frm.doc.net_total - frm.doc.total_payments);
		frm.set_value("net_total_invoice_currency", frm.doc.net_total * frm.doc.exchange_rate);
	},
	total_payments(frm) {
		frm.set_value("due_amount", frm.doc.net_total - frm.doc.total_payments);
	},
	// end primary caculations
});

frappe.ui.form.on("Contractor Invoice Item", {
	// start primary caculations
	previous(frm, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);
		frappe.model.set_value(cdt, cdn, "accepted_qty", row.previous + row.current);
	},
	current(frm, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);
		frappe.model.set_value(cdt, cdn, "accepted_qty", row.previous + row.current);
	},
	accepted_qty(frm, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);
		frappe.model.set_value(cdt, cdn, "subtotal", row.accepted_qty * row.rate);
	},
	rate(frm, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);
		frappe.model.set_value(cdt, cdn, "subtotal", row.accepted_qty * row.rate);
	},
	subtotal(frm, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);
		frappe.model.set_value(cdt, cdn, "grand_total", row.subtotal * (row.percentage / 100));
		let total = 0;
		frm.doc.items.forEach((item) => {
			total += item.subtotal;
		});
		frm.set_value("subtotal", total);
	},
	percentage(frm, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);
		frappe.model.set_value(cdt, cdn, "grand_total", row.subtotal * (row.percentage / 100));
	},
	grand_total(frm, cdt, cdn) {
		let total = 0;
		frm.doc.items.forEach((item) => {
			total += item.grand_total;
		});
		frm.set_value("grand_total", total);
		frm.set_value("net_total", frm.doc.grand_total - frm.doc.discount_total - frm.doc.insurance_total);
	},
	// end primary caculations
});

frappe.ui.form.on("Contractor Payments", {
	payment_id(frm, cdt, cdn) {
		frappe.msgprint("A row has been added to the links table 🎉 ");
		const paymentItems = frm.doc.payments_list;
		let totalPayments = 0;
		if (paymentItems.length) {
			paymentItems.forEach((item) => {
				if (item.amount) {
					totalPayments += item.amount;
				}
			});
			frm.set_value("total_payments", parseInt(totalPayments));
			frm.refresh_field("total_payments");
		}
	},
});
