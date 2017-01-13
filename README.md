# Heating Automation project #

Arduino part needs two libs:
- SparkFun HTU21D
- Metro Lib for timers

## CC-RT-BLE Heating Thermostat ##

### Where to buy ###

As on 13. jan 2017

https://www.notebooksbilliger.de/eqiva+eq+3+bluetooth+smart+heizkoerperthermostat?nbb=8f14e4

### How to manage ###

The `eq3btsmart` climate platform allows you to integrate EQ3 Bluetooth Smart Thermostats.

The only functionality is to set the temperature, there doesn't seem to be any way to query the temperature sensor or battery level ([read more](https://forum.fhem.de/index.php/topic,39308.15.html)).

Setup is a bit more cumbersome than for most other thermostats. It has to be paired first:

```bash
bluetoothctl
scan on
<Wait for the thermostat to be found, which looks like this: [NEW] Device 00:11:22:33:44:55 CC-RT-BLE>
scan off
<Set the thermostat to pairing mode.>
pair <MAC>
trust <MAC>
disconnect <MAC>
exit
```

Then check with gatttool if the connection works as expected:

```bash
gatttool -b 00:11:22:33:44:55 -I
[00:11:22:33:44:55][LE]> connect
Attempting to connect to 00:11:22:33:44:55
Connection successful
[00:11:22:33:44:55][LE]> char-write-req 0x0411 03
Characteristic value was written successfully
Notification handle = 0x0421 value: 02 01 09 14 04 2d
[00:11:22:33:44:55][LE]> disconnect
[00:11:22:33:44:55][LE]> exit
```

Important: For gatttool or homeassistant to work, the thermostat needs to be disconnected from bluetoothd, so I found it best to modify the hass-daemon startscript by adding:

```bash
/usr/bin/bt-device -d CC-RT-BLE
```

### Other projects ###

How to manage was acquired by loging HCI Bluetooth on Android phone while BT Calor app was running.
Another source was:

https://github.com/home-assistant/home-assistant.github.io/blob/next/source/_components/climate.eq3btsmart.markdown

