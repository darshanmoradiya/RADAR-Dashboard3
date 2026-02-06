# Sample Devices Import File

This CSV file contains 10 sample device records for testing the Excel import feature in the RADAR Dashboard.

## How to Use

### Option 1: Import as CSV
1. Open RADAR Dashboard
2. Navigate to **Inventory List** page
3. Click **"Import Excel"** button
4. Select `sample_devices.csv`

### Option 2: Convert to Excel
1. Open `sample_devices.csv` in Microsoft Excel
2. Save As → Excel Workbook (.xlsx)
3. Import the .xlsx file in RADAR Dashboard

## File Contents

The file includes various device types:
- **2× ACTIVE Devices** - Standard active network devices
- **2× Switches** - Network switches
- **1× Router** - Network router
- **2× Desktops** - Desktop computers
- **1× Firewall** - Security appliance
- **1× Camera** - IP camera
- **1× Smartphone** - Mobile device

## Column Structure

| Column | Description | Values |
|--------|-------------|--------|
| **IP Address** | Device IPv4 address | `192.168.x.x`, `10.0.0.x` |
| **MAC Address** | Physical hardware address | Format: `XX:XX:XX:XX:XX:XX` |
| **Type** | Device classification | ACTIVE, Switch, Router, DESKTOP, CAMERA, SMARTPHONE, FIREWALL |
| **Confidence Score** | Detection confidence | 80-100% |

## Expected Import Result

When you import this file:
- **If devices exist with matching MAC/IP**: They will be updated/overridden
- **If devices are new**: They will be added to the inventory
- **Import message**: "Imported: X new, Y updated"

## Undo Feature

After import, you can:
1. Click **"Undo Import"** button to revert changes
2. Restore inventory to state before import
3. Test import behavior without permanent changes

## Customization

You can modify this file to test different scenarios:
- Change IP addresses to match your network
- Update device types to match your environment 
- Adjust confidence scores
- Add vendor information (optional column)
- Add device names (optional column)

## Additional Columns

You can add these optional columns:
- `Device Name` - Custom device hostname
- `Vendor` - Manufacturer name
- `Network` - Network segment name
- `Detection Method` - How device was discovered

See `docs/EXCEL_IMPORT_GUIDE.md` for complete documentation.
