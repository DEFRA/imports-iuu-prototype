# Evidence: current Part 1 v5 HTML prototype, route logic and supplied stakeholder-answer fixture. No separate Figma/PDF or source backlog was supplied.
# Backlog scenarios ARR-01..ARR-06 and SUM-08 are traced at feature level; per-scenario mapping is pending Q-09.
@SCR-01 @W06-02 @W06-03 @ARR-01 @ARR-02 @ARR-03 @ARR-04 @ARR-05 @ARR-06 @SUM-08
Feature: Consignment details
  As an importer or agent
  I want to tell the service where and when my consignment will arrive and where it is exported from
  So that my import notification can be checked before the consignment arrives

  Background:
    Given I have started an import notification
    And I have chosen "Ship or vessel" as the transport type
    And I am on the "Consignment details" page

  Rule: BR-07 – Valid answers are saved to the draft and I move on

    @BR-07
    Scenario: Consignment from a country that does not need a CHED number
      When I select "Felixstowe" as the port of entry
      And I enter tomorrow's date as the expected date of arrival
      And I enter "14:30" as the expected time of arrival
      And I select "France" as the country of export
      And I save and continue
      Then my answers are saved to the draft notification
      And I am on the "Species details" page in the manual journey

    @BR-07 @ERR-17 @proposed
    Scenario: Answers cannot be saved
      Given the draft notification cannot be saved
      When I complete the page correctly and save and continue
      Then I see "Sorry, there is a problem with the service. Your answers have not been saved. Try again later."

    @BR-07 @proposed
    Scenario: Extraction journey continues to Commodity details
      Given I am continuing an extraction journey
      When I complete the page correctly and save and continue
      Then I am on the "Commodity details" page

  Rule: BR-01 / BR-02 – Ports of entry depend on the transport type, which is played back

    @BR-02
    Scenario: The transport type I chose is played back
      Then I see "Ship or vessel" as the transport type
      And I can change the transport type from this page

    @BR-01
    Scenario: Only ports permitted for the transport type are offered
      Given I have chosen "Air freight" as the transport type
      When I view the port of entry options
      Then "Felixstowe" is not offered

    @VR-03 @ERR-03 @to-confirm
    Scenario: A port not permitted for the transport type is rejected by the service
      Given I have chosen "Air freight" as the transport type
      When "Felixstowe" is submitted as the port of entry
      Then I see the error "Select a port of entry that accepts Air freight consignments."

    @BR-03 @proposed
    Scenario: Changing the transport type clears a port it does not permit
      Given I have saved "Felixstowe" as the port of entry
      When I change the transport type to "Air freight"
      And I return to the "Consignment details" page
      Then no port of entry is selected

    @BR-11 @ERR-18 @proposed @to-confirm
    Scenario: No ports are available for the transport type
      Given no ports of entry are permitted for the chosen transport type
      Then I see "There are no ports of entry for Ship or vessel. Change the transport type."

    @BR-10 @ERR-16 @proposed
    Scenario: The port list cannot be loaded
      Given the port of entry list is unavailable
      When I open the "Consignment details" page
      Then I see "Sorry, there is a problem with the service. Try again later."
      And my previously saved answers are kept

  Rule: The port of entry must be given

    @VR-01 @ERR-01
    Scenario: No port of entry selected
      When I save and continue without selecting a port of entry
      Then I see the error "Select a port of entry."

    @VR-02 @ERR-02 @proposed
    Scenario: The selected port is no longer active
      Given the port "Felixstowe" has been made inactive in Master Data
      When "Felixstowe" is submitted as the port of entry
      Then I see the error "Select a port of entry."

  Rule: The expected date of arrival must be a complete, real date that is today or later (UK time)

    @VR-04 @ERR-04
    Scenario: No date entered
      When I save and continue without entering an expected date of arrival
      Then I see the error "Enter a valid expected arrival date that is today or in the future."

    @VR-05 @ERR-05
    Scenario Outline: Part of the date is missing
      When I enter day "<day>", month "<month>" and year "<year>" as the expected date of arrival
      And I save and continue
      Then I see the error "Enter a valid expected arrival date that is today or in the future."
      And the parts I entered are kept

      Examples:
        | day | month | year | missing |
        |     | 3     | 2027 | day     |
        | 27  |       | 2027 | month   |
        | 27  | 3     |      | year    |

    @VR-06 @ERR-06
    Scenario Outline: The date is not a real date
      When I enter day "<day>", month "<month>" and year "<year>" as the expected date of arrival
      And I save and continue
      Then I see the error "Enter a valid expected arrival date that is today or in the future."

      Examples:
        | day | month | year |
        | 31  | 2     | 2027 |
        | 0   | 1     | 2027 |
        | 1   | 13    | 2027 |
        | 1   | 1     | 27   |
        | a   | b     | c    |

    @VR-07 @ERR-07
    Scenario: The date is in the past
      When I enter yesterday's date as the expected date of arrival
      And I save and continue
      Then I see the error "Enter a valid expected arrival date that is today or in the future."

    @VR-07
    Scenario Outline: Today and future dates are accepted
      When I enter <date> as the expected date of arrival
      And I complete the rest of the page correctly and save and continue
      Then I do not see an error for the expected date of arrival

      Examples:
        | date            |
        | today's date    |
        | tomorrow's date |

    @VR-07
    Scenario: "Today" is based on UK time
      Given the current UK time is 00:30 BST on 1 April 2027
      When I enter day "1", month "4" and year "2027" as the expected date of arrival
      And I complete the rest of the page correctly and save and continue
      Then I do not see an error for the expected date of arrival

  Rule: The expected time of arrival must be a complete time on the 24-hour clock

    @VR-08 @ERR-08
    Scenario: No time entered
      When I save and continue without entering an expected time of arrival
      Then I see the error "Enter a valid expected arrival time."

    @VR-09 @ERR-09
    Scenario Outline: Part of the time is missing
      When I enter hour "<hour>" and minute "<minute>" as the expected time of arrival
      And I save and continue
      Then I see the error "Enter a valid expected arrival time."

      Examples:
        | hour | minute | missing  |
        |      | 30     | an hour  |
        | 14   |        | minutes  |

    @VR-10 @ERR-10
    Scenario Outline: Hour out of range
      When I enter hour "<hour>" and minute "30" as the expected time of arrival
      And I save and continue
      Then I see the error "Enter a valid expected arrival time."

      Examples:
        | hour |
        | 24   |
        | -1   |
        | ab   |

    @VR-11 @ERR-11
    Scenario Outline: Minute out of range
      When I enter hour "14" and minute "<minute>" as the expected time of arrival
      And I save and continue
      Then I see the error "Enter a valid expected arrival time."

      Examples:
        | minute |
        | 60     |
        | -1     |
        | x      |

    @VR-10 @VR-11
    Scenario Outline: Boundary times are accepted
      When I enter hour "<hour>" and minute "<minute>" as the expected time of arrival
      And I complete the rest of the page correctly and save and continue
      Then I do not see an error for the expected time of arrival

      Examples:
        | hour | minute |
        | 0    | 0      |
        | 23   | 59     |

  Rule: The country of export must be given

    @VR-12 @ERR-12
    Scenario: No country selected
      When I save and continue without selecting a country of export
      Then I see the error "Select a country of export from the list."

    @VR-13 @ERR-13 @proposed
    Scenario: The selected country is no longer active
      Given "France" has been made inactive in the country list
      When "France" is submitted as the country of export
      Then I see the error "Select a country of export from the list."

  Rule: BR-04 – A CHED number is needed only when the country of export is on the agreed RoW list

    @BR-04
    Scenario Outline: The CHED question depends on the country of export
      When I select "<country>" as the country of export
      Then the CHED number question is <visibility>

      Examples:
        | country   | visibility |
        | Australia | shown      |
        | France    | not shown  |

    @VR-14 @ERR-14
    Scenario: CHED number missing for a RoW country
      When I select "Australia" as the country of export
      And I save and continue without entering a CHED number
      Then I see the error "Enter a CHED number."

    @VR-15 @ERR-15 @to-confirm
    Scenario: CHED number in the wrong format
      When I select "Australia" as the country of export
      And I enter a CHED number that does not match the agreed format
      And I save and continue
      Then I see the error "Enter the CHED number in the correct format"

    @BR-05 @proposed
    Scenario: CHED number is discarded when the country no longer needs one
      Given I selected "Australia" and entered a CHED number
      When I change the country of export to "France"
      And I complete the rest of the page correctly and save and continue
      Then no CHED number is saved on the draft notification

    @BR-04 @a11y @to-confirm
    Scenario: Screen reader users know the CHED question has appeared
      Given I am using a screen reader
      When I select "Australia" as the country of export
      Then I am made aware that the CHED number question is now on the page

  Rule: Returning and resubmitting

    @BR-08 @proposed
    Scenario: My saved answers are shown when I return
      Given I have saved my consignment details
      When I return to the "Consignment details" page
      Then I see my saved port of entry, date, time, country of export and CHED number

    @BR-09 @proposed
    Scenario: Pressing Save and continue twice saves once
      When I complete the page correctly
      And I press Save and continue twice quickly
      Then my answers are saved once

  Rule: Errors are presented accessibly

    @a11y @VR-01 @VR-04 @VR-08 @VR-12
    Scenario: Several errors at once
      When I save and continue without answering any question
      Then I see an error summary titled "There is a problem"
      And it lists, in page order, "Select a port of entry.", "Enter a valid expected arrival date that is today or in the future.", "Enter a valid expected arrival time." and "Select a country of export from the list."
      And focus moves to the error summary
      And each error links to its question
