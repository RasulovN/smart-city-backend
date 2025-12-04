# Task: Implement Appeals Statistics for UI

## Completed Tasks
- [x] Added Appeal model import to ui.controller.js
- [x] Implemented getAppealsStatistics method in ui.controller.js
  - Aggregates appeals by status
  - Calculates total, viewed (waiting_response), in_progress, and rejected counts
  - Returns JSON response with statistics
- [x] Fixed route in ui.route.js to point to getAppealsStatistics instead of getAllSectors

## Summary
The `/appeals-statistika` endpoint now provides statistics on:
- Total number of appeals
- Number of viewed appeals (status: waiting_response)
- Number of appeals in progress (status: in_progress)
- Number of rejected appeals (status: rejected)
