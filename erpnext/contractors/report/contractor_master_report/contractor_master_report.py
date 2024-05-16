# Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from frappe import _, msgprint



def execute(filters=None):
	if not filters: filters = {}
	
	data, columns = [], []

	columns = get_columns()
	cs_data = get_cs_data(filters)

	if not cs_data:
		msgprint(_('No records found'))
		return columns, cs_data

	data = []
	for d in cs_data:
		row = frappe._dict({
				'contractor': d.contractor,
				'project': d.project,
				'subtotal': d.subtotal,
				'grand_total': d.grand_total,
				'insurance':d.insurance,
				'discount': d.discount,
				'net_total': d.net_total,
				'total_payments':d.total_payments,
				'due_amount':d.due_amount
			})
		

		data.append(row)
	# chart = get_chart_data(data)
	# report_summary = get_report_summary(data)
	return columns, data


def get_columns():
	return [
		# {
		# 	'fieldname': 'name',
		# 	'label': _('Id'),
		# 	'fieldtype': 'Link',
		# 	"options": "Contractor Invoice",
		# 	'width': '200'
		# },
		{
			'fieldname': 'contractor',
			'label': _('Contractor'),
			"fieldtype": "Link",
			"options": "Supplier",
			'width': '200'
		},
		{
			'fieldname': 'project',
			'label': _('Project'),
			'fieldtype': 'Data',
			'width': '150'
		},
		{
			'fieldname': 'subtotal',
			'label': _('Subtotal'),
			'fieldtype': 'Currency',
			"options": "currency",
			'width': '150'
		},
		{
			'fieldname': 'grand_total',
			'label': _('Grand Total'),
			'fieldtype': 'Currency',
			"options": "currency",
			'width': '150'
		},
		{
			'fieldname': 'insurance',
			'label': _('Insurance'),
			'fieldtype': 'Currency',
			"options": "currency",
			'width': '150'
		},
		{
			'fieldname': 'discount',
			'label': _('Discount'),
			'fieldtype': 'Currency',
			"options": "currency",
			'width': '150'
		},
		{
			'fieldname': 'net_total',
			'label': _('Net Total'),
			'fieldtype': 'Currency',
			"options": "currency",
			'width': '150'
		},
		{
			'fieldname': 'total_payments',
			'label': _('Payments'),
			'fieldtype': 'Currency',
			"options": "currency",
			'width': '150'
		},
		{
			'fieldname': 'due_amount',
			'label': _('Due Amount'),
			'fieldtype': 'Currency',
			"options": "currency",
			'width': '150'
		},
	]

def get_cs_data(filters):
	conditions = get_conditions(filters)
	data = frappe.get_all(
		doctype='Contractor Invoice',
		fields=['contractor', 'project', "subtotal", "grand_total","insurance","discount", "net_total", "total_payments", "due_amount", ],
		filters=conditions,
		order_by='name desc'
	)
	return data

def get_conditions(filters):
	conditions = {}
	for key, value in filters.items():
		if filters.get(key):
			if(type(value) == list):
				conditions[key] = ('in', value)
			else:
				conditions[key] = value

	return conditions


# def get_chart_data(data):
# 	if not data:
# 		return None

# 	labels = ['Age <= 45','Age > 45']

# 	age_data = {
# 		'Age > 45': 0,
# 		'Age <= 45': 0,
# 	}
# 	datasets = []

# 	for entry in data:
# 		if entry.age <= 45:
# 			age_data['Age <= 45'] += 1
			
# 		else:
# 			age_data['Age > 45'] += 1

# 	datasets.append({
# 		'name': 'Age Status',
# 		'values': [age_data.get('Age <= 45'),age_data.get('Age > 45')]
# 	})

# 	chart = {
# 		'data': {
# 			'labels': labels,
# 			'datasets': datasets
# 		},
# 		'type': 'bar',
# 		'height': 300,
# 	}

# 	return chart


# def get_report_summary(data):
# 	if not data:
# 		return None

# 	age_below_45, age_above_45 = 0, 0

# 	for entry in data:
# 		if entry.age <= 45:
# 			age_below_45 += 1
			
# 		else:
# 			age_above_45 += 1
# 	return [
# 		{
# 			'value': age_below_45,
# 			'indicator': 'Green',
# 			'label': 'Age Below 45',
# 			'datatype': 'Int',
# 		},
# 		{
# 			'value': age_above_45,
# 			'indicator': 'Red',
# 			'label': 'Age Above 45',
# 			'datatype': 'Int',
# 		}
# 	]



# def execute(filters=None):
# 	columns = [
#     ("Naming Series") + "::150",
#     ("Contractor") + "::150",
#     ("Transaction Date") + "::150",
#     ("Project") + "::150",
#     ("Cost Center") + "::150",
#     ("Subtotal") + "::150",
#     ("Test") + "::150",
#   ]
# 	data = frappe.db.sql("SELECT `naming_series`,`contractor`, `transaction_date`, `project`, `cost_center`, `subtotal` FROM `tabContractor Invoice` ", as_dict=True)
# 	frappe.msgprint(str(data))
# 	data.append(
# 		{'naming_series': None,
# 		'contractor': None,
# 		'transaction_date': None,
# 		'project': None,
# 		'cost_center': None,
# 		'subtotal': None,
# 		'total': None,
# 		'test':50,
# 	});


# # data = columns, data1
# 	columns, data = [], []
# 	return columns, data
