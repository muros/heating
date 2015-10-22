/* 
 HTU21D Humidity Sensor Example Code
 Uses the HTU21D library to display the current humidity and temperature
 
 Open serial monitor at 9600 baud to see readings. Errors 998 if not sensor is detected. Error 999 if CRC is bad.
  
 Hardware Connections (Breakoutboard to Arduino):
 -VCC = 3.3V
 -GND = GND
 -SDA = A4 (use inline 330 ohm resistor if your board is 5V)
 -SCL = A5 (use inline 330 ohm resistor if your board is 5V)

 */
#include <Wire.h>
#include "SparkFunHTU21D.h"
#include "Metro.h"

HTU21D myHumidity;
Metro serialMetro = Metro(10000);  // Instantiate an instance

// Define which pin to be used to communicate with Base pin of TIP120 transistor
const int TIP120pin = 11; // for this project, I pick Arduino's PMW pin 11

const int flameIndPin = 10; // flame indicator pin

const int buttonPin = 2;  // the number of the pushbutton pin

const int ledNight = 5;
const int ledDay = 4;
const int ledTimer = 3;

const float DAY_TEMP = 22.0;
const float NIGHT_TEMP = 17.0;

// Variables for state
int buttonState;
int lastButtonState = LOW;

long lastDebounceTime = 0;  // the last time the output pin was toggled
long debounceDelay = 50;    // the debounce time; increase if the output flickers

int ledOffState = 1;
int ledNightState = 0;
int ledDayState = 0;
int ledTimerState = 0;
int ledOnState = 0;

int flameLevel = 0;

void setup() {
  // Setup TIP120
  pinMode(TIP120pin, OUTPUT); // Set pin for output to control TIP120 Base pin
  analogWrite(TIP120pin, 0); // By changing values from 0 to 255 you can control brightnes

  // Setup flame indicatro light
  pinMode(flameIndPin, OUTPUT);
  analogWrite(flameIndPin, flameLevel);
  
  // Setup button
  pinMode(buttonPin, INPUT);

  // Setup indicator LEDs
  pinMode(ledNight, OUTPUT);
  pinMode(ledDay, OUTPUT);
  pinMode(ledTimer, OUTPUT);
  displayLed();
  
  Serial.begin(9600);
  Serial.println("Thermostat Proto");

  myHumidity.begin();
}

void loop() {
  // Read the state of the switch into a local variable:
  int reading = digitalRead(buttonPin);

  // check to see if you just pressed the button
  // (i.e. the input went from LOW to HIGH),  and you've waited
  // long enough since the last press to ignore any noise:

  // If the switch changed, due to noise or pressing:
  if (reading != lastButtonState) {
    // reset the debouncing timer
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    // whatever the reading is at, it's been there for longer
    // than the debounce delay, so take it as the actual current state:

    // if the button state has changed:
    if (reading != buttonState) {
      buttonState = reading;

      // only toggle the LED if the new button state is HIGH
      if (buttonState == HIGH) {
        toggleLed();
      }
    }
  }

  // set the LEDs:
  displayLed();

  // save the reading.  Next time through the loop,
  // it'll be the lastButtonState:
  lastButtonState = reading;

  // Read humidity sensor
  float humd = myHumidity.readHumidity();
  float temp = myHumidity.readTemperature();

  // Calculate and display flame level
  if (ledNightState == HIGH) {
    flameLevel = calcFlameLevel(temp, NIGHT_TEMP);
  } else if (ledDayState == HIGH) {
    flameLevel = calcFlameLevel(temp, DAY_TEMP);
  } else if (ledOnState == HIGH) {
    flameLevel = 255;
  } else if (ledTimerState == HIGH) {
    flameLevel = 0; // for now off
  } else if (ledOffState == HIGH) {
    flameLevel = 0;
  }
  analogWrite(flameIndPin, flameLevel);
  analogWrite(TIP120pin, 255 - flameLevel); 
  
  // Send data to serial port
  if (serialMetro.check() == 1) {    
    Serial.print("Time:");
    Serial.print(millis());
    Serial.print(" Temperature:");
    Serial.print(temp, 1);
    Serial.print("C");
    Serial.print(" Humidity:");
    Serial.print(humd, 1);
    Serial.print("%");
    Serial.print(" Flame:");
    Serial.print(255 - flameLevel);
    Serial.println();
  }  

}

int calcFlameLevel(float currentTemp, float desiredTemp) {

  int fl = 0;
  float deltaTemp = desiredTemp - currentTemp;
  if (deltaTemp > 0.0) {
    if (deltaTemp > 3.0) {
      fl = 255;
    } else {
      fl = (deltaTemp / 3.0) * 255;
    }
  } else {
    fl = 0;
  }

  return fl;
}

void toggleLed() {
  if(ledNightState == HIGH) {
    ledNightState = LOW;
    ledDayState = HIGH;
  } else if (ledDayState == HIGH) {
    ledDayState = LOW;
    ledTimerState = HIGH;
  } else if (ledTimerState == HIGH) {
    ledTimerState = LOW;
    ledOnState = HIGH;
  } else if (ledOnState == HIGH) {
    ledOnState = LOW;
    ledOffState = HIGH;
  } else if (ledOffState == HIGH) {
    ledOffState = LOW;
    ledNightState = HIGH;
  }
}

void displayLed() {
  if(ledNightState == HIGH) {
    digitalWrite(ledNight, HIGH);
    digitalWrite(ledDay, LOW);
    digitalWrite(ledTimer, LOW);
  } else if (ledDayState == HIGH) {
    digitalWrite(ledNight, LOW);
    digitalWrite(ledDay, HIGH);
    digitalWrite(ledTimer, LOW);
  } else if (ledTimerState == HIGH) {
    digitalWrite(ledNight, LOW);
    digitalWrite(ledDay, LOW);
    digitalWrite(ledTimer, HIGH);
  } else if (ledOnState == HIGH) {
    digitalWrite(ledNight, HIGH);
    digitalWrite(ledDay, HIGH);
    digitalWrite(ledTimer, HIGH);
  } else if (ledOffState == HIGH) {
    digitalWrite(ledNight, LOW);
    digitalWrite(ledDay, LOW);
    digitalWrite(ledTimer, LOW);
  }
}

