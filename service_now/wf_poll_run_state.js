/*global tf_workspace, tf_run, tf_terraform_record, tf_util*/
/*
  Workspace Polling
    Finds any records not in an applied state then
    queries the Terraform Enterprise API for their status.
*/

// System Property variables for Terraform API
var workspace       = new tf_workspace();
var run             = new tf_run();
var policy_check    = new tf_policy();
var terraformRecord = new tf_terraform_record();
var util            = new tf_util();

// Search Terraform Table for any records not in "applied" state
var gr = new GlideRecord("x_325709_terraform_terraform");
gr.addQuery("last_known_state", "!=", "applied");
gr.addQuery("is_destroyable", "=", false);
gr.query();

// Loop through all records
while (gr.next()) {
  var runID;

  // Fetch Workspace Current Run Info
  var currentRun = workspace.getWorkspaceCurrentRun(gr.workspace_name);
  if (currentRun !== null) {
    runID = currentRun.id;
  } else {
    gr.last_known_state = String(currentRun);
    gr.update();
    continue; // move on to next record
  }

  // Fetch Run State Info and update record  
  var runState = run.getRunState(runID).toLowerCase();

  // if (runState === gr.last_known_state) {
  //   continue; // no-op
  // }
  if (gr.last_known_state != runState) {
    gr.last_known_state = runState;
    gr.update();
  
    // Post a comment with run state info to the request item
    var comment;
    switch (runState) {
      case "planned", "planned_and_finished":
        comment = util.formatCommentBlockQuote("Terraform: Plan Finished");
        break;
  
      case "applied":
        // Fetch workspace outputs once the run has been applied and include in comment
        comment = util.formatCommentBlockQuote("Terraform: Apply Finished");
        var outputs = workspace.getCurrentOutputs(gr.workspace_id);
        if (outputs) {
          comment = comment + util.formatCommentOutputs(outputs);
        }
        break;
  
      case "pending", "confirmed", "errored", "canceled", "discarded":
        comment = util.formatCommentBlockQuote("Terraform: Run " + runState.capitalize());
        break;
      case "policy_override":
        var approval_gr = new GlideRecord('sysapproval_approver');
        approval_gr.initialize();
        // Spa Ghetti User Id
        approval_gr.approver = "spa.ghetti";
        approval_gr.state = 'requested';
        approval_gr.sysapproval = gr.requested_item; 
        // approval_gr.sys_tags = 
        approval_gr.insert();





        comment = util.formatCommentBlockQuote("Sentinel: Manual Approval Required");
        break;
      default:
        comment = util.formatCommentBlockQuote("Terraform: " + runState);
    }
    terraformRecord.postRITMComment(gr.requested_item, comment);
  } else {

    var approval_gr = new GlideRecord('sysapproval_approver');
    approval_gr.addQuery("sysapproval", "=", gr.requested_item);
    approval_gr.query();

    var approved = true;
  
    while (approval_gr.next()) {
      if(approval_gr.state != "approved") {
        approved = false;
      }
    }

    if (approved && runState == "policy_override") {
      var policy_checks = run.getRun(runID).data.relationships["policy-checks"]["data"]
      if (policy_checks.length > 0) {
        policy_check.overridePolicy(policy_checks[0].id);
      }
  
      comment = util.formatCommentBlockQuote("Policy Override Approved");
      terraformRecord.postRITMComment(gr.requested_item, comment);
    }
  }

}

