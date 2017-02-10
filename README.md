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

### Option on Kura Pi device ###

Find out address of ThermCtrl
```bash
$sudo hcitool lescan

LE Scan ...
ED:44:66:95:FB:9E ThermCtrl
00:1A:22:07:28:01 (unknown)
ED:44:66:95:FB:9E (unknown)
00:1A:22:07:28:01 CC-RT-BLE
```

Do not forget -t random option, RedBear nano does not connect without that option.

```bash
$sudo gatttool -t random -b ED:44:66:95:FB:9E -I

[][ED:44:66:95:FB:9E][LE]>connect
[CON][ED:44:66:95:FB:9E][LE]>characteristics
handle: 0x0002, char properties: 0x0a, char value handle: 0x0003, uuid: 00002a00-0000-1000-8000-00805f9b34fb
handle: 0x0004, char properties: 0x02, char value handle: 0x0005, uuid: 00002a01-0000-1000-8000-00805f9b34fb
handle: 0x0006, char properties: 0x02, char value handle: 0x0007, uuid: 00002a04-0000-1000-8000-00805f9b34fb
handle: 0x0009, char properties: 0x20, char value handle: 0x000a, uuid: 00002a05-0000-1000-8000-00805f9b34fb
handle: 0x000d, char properties: 0x02, char value handle: 0x000e, uuid: 0000a001-0000-1000-8000-00805f9b34fb
handle: 0x000f, char properties: 0x08, char value handle: 0x0010, uuid: 0000a002-0000-1000-8000-00805f9b34fb
```

Last is value of how mouch to open valve:
```bash
[CON][ED:44:66:95:FB:9E][LE]>char-write-req  0x0010 10
```

Read value writen
```bash
[CON][ED:44:66:95:FB:9E][LE]>char-read-hnd  0x000e
```

Don't know how to advertise value once writen.
Do I need that?
