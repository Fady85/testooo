// Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Contractor Report"] = {
	filters: [
		{
			fieldname: "contractor",
			label: __("Contractor"),
			fieldtype: "MultiSelectList",
			mandatory: 1,
			get_data: function (txt) {
				return frappe.db.get_link_options("Supplier", txt);
			},
			get_query: () => {
				return {
					filters: { is_contractor: 1 },
				};
			},
		},
		{
			fieldname: "project",
			label: __("Project"),
			fieldtype: "MultiSelectList",
			mandatory: 1,
			get_data: function (txt) {
				return frappe.db.get_link_options("Project", txt);
			},
			// "default": frappe.datetime.now_date(),
		},
	],
};
