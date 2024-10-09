Customs scripts for "Cisco Meraki device by HTTP" template to get data from Meraki API and showing them in "latest data" menu.

 GetDeviceData.js : Base script for "Meraki : Get device data"  item but modified in order to avoid requesting while being rate limited and generate a ton of errors.

 GetCurrentClientOnAPs.js : Script to get the number of connected devices in an AP. Create a new item, the type is "Script" and then enter this script. You can also create triggers when the item is setted up.
