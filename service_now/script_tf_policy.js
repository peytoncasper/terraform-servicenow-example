/*global tf_policy, tf_http*/

// Terraform Variables
var tf_policy = Class.create();
tf_policy.prototype = {
	initialize: function() {},
	

	/*	
	* @param {String} policy_check_id - Policy Check ID
	*/
	overridePolicy: function(policy_check_id) {
		var http = new tf_http("TF Policy Checks", "Override Policy", null);
		http.setParam("policy_check_id", policy_check_id);

		var parsedResponse = http.execute();

    	return parsedResponse;
	},

	type: 'tf_policy'
};
