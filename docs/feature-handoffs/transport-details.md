# Transport Details

## 1. Executive Summary

The manual-entry Transport details step records how a consignment is expected to arrive: by ship or vessel, air freight, or road vehicle.

## 2. Feature Overview

The page asks the importer to select one transport mode and then continue to Arrival details. It states that transport details will be taken from uploaded documents.

The prototype also contains a conditional-fields partial with these intended fields:

- Ship or vessel: vessel name, flag state, and optional bill of lading reference.
- Air freight: flight number or airway bill number.
- Road vehicle: vehicle registration number and optional container number.

**Current implementation:** the Transport details page does not include that partial. The rendered page therefore only collects the mode selection; the conditional detail fields are not currently shown to the user.

## 3. GOV.UK Components and Custom Elements

- GOV.UK radios provide the three transport-mode choices.
- A fieldset and legend group the radios under “How is the consignment being transported?”
- The page uses a GOV.UK error summary and inline error for an invalid or missing mode.
- The conditional-fields partial uses GOV.UK text inputs, but it is not included by the page template and is not connected to the radio choices.

## 4. Validation Rules and Error Messages

- The POST route accepts only `vessel`, `air`, or `road` as `transport-type`.
- If the value is missing or not one of those values, the route clears the saved transport type, returns HTTP 400, and shows: “Select how the consignment is being transported.”
- The route copies transport-detail values from the request when present. It does not validate their content or require any of them.
- The partial labels the bill of lading and container number as optional or conditional, but those rules are not enforced by the route.

## 5. Design Decisions

- A single radio choice represents the consignment’s transport mode.
- The page copy indicates that supporting documents are expected to provide transport details, while the unconnected partial suggests an alternate manual-entry flow. Which approach is intended needs product confirmation.

## 6. Accessibility and Browser Support

- The rendered radio group has an associated fieldset legend and a label for each choice.
- On validation failure, the error summary uses `role="alert"`, is focusable, and links to the transport-type control. The fieldset describes itself with the inline error.
- The radio group uses the GOV.UK Frontend radios module.
- The dormant partial has labels associated with its inputs, but its hidden containers are not wired to the radio inputs with conditional-control attributes.
- No separate browser-support requirements are documented in the prototype.

## 7. Known Limitations and Edge Cases

- The mode-specific fields do not render because the partial is not included in the page.
- Existing detail values are only overwritten when their fields are present in the request. Changing modes does not explicitly clear fields from the previous mode.
- Check your answers conditionally displays details based on the saved mode, but optional values may be absent and are shown as em dashes.
- There are no route tests specifically covering the Transport details step.

## 8. Next Steps for the Live Build

- Confirm whether transport details should be entered manually, extracted from documents, or both.
- Confirm which fields are required for each transport mode and what format validation applies.
- If manual entry is needed, render the conditional partial and wire each radio to its matching conditional group using the GOV.UK radios pattern.
- Clear or ignore values belonging to an unselected transport mode, and make Check your answers reflect the agreed rules.
- Add tests for each mode, invalid selection, conditional visibility, required fields, and changing a previously selected mode.