# Spec Delta

## ADDED Requirements

### Requirement: Touch steppers
On touch screens (`pointer: coarse`) or with `touch-steppers`, the input group SHALL show a decrease button before and an increase button after the value: `| < | value unit | > |`. Each button SHALL be at least 44px wide and tall, SHALL repeat while held, SHALL be disabled at its end of the range, and SHALL be named "Decrease/Increase <label>". The number field's small arrows SHALL be hidden in this mode.

#### Scenario: Holding increase
- **WHEN** a touch user holds the > button
- **THEN** the value steps up repeatedly until released or until max
