# Excel Import Guide

## Overview
The Device List now supports importing devices from Excel files (.xlsx, .xls, .csv). Imported devices will **override** existing devices based on matching MAC address or IP address.

**📁 Sample File:** A sample CSV file is provided at `sample_devices.csv` in the root directory.

## Excel File Format

### Required Columns
Your Excel file should contain the following columns (column names are case-insensitive):

| Column Name | Alternative Names | Description | Example |
|------------|------------------|-------------|---------|
| Device Name | name, Device | Device hostname or name | `Server-01` |
| IP Address | ip, IP | IPv4 or IPv6 address | `192.168.1.100` |
| MAC Address | mac, MAC | Physical MAC address | `00:1A:2B:3C:4D:5E` |
| Type | type | Device type/category | `ACTIVE`, `Switch`, `Router` |
| Vendor | vendor | Device manufacturer | `Cisco`, `Dell`, `HP` |

### Optional Columns
| Column Name | Alternative Names | Description | Example |
|------------|------------------|-------------|---------|
| Confidence Score | Confidence, confidence | Detection confidence (0-100) | `95` |
| Network | network | Network segment | `Production` |
| Detection Method | detection_method | How device was found | `SNMP`, `ARP` |
| Last Seen | last_seen | Last detection timestamp | `2026-02-06T10:30:00Z` |
| Name Source | name_source | Source of device name | `DNS`, `SNMP` |
| Domain | netbios_domain | NetBIOS domain | `CORP` |
| User | logged_in_user | Logged in user | `admin` |

## Sample Excel Template

```
Device Name    | IP Address      | MAC Address       | Type   | Vendor | Confidence | Network
---------------|-----------------|-------------------|--------|--------|------------|----------
Server-Main    | 192.168.1.10   | 00:1A:2B:3C:4D:5E | ACTIVE | Dell   | 98         | Production
Switch-Core    | 192.168.1.1    | AA:BB:CC:DD:EE:FF | Switch | Cisco  | 100        | Core
Desktop-101    | 192.168.1.101  | 11:22:33:44:55:66 | ACTIVE | HP     | 85         | Office
Camera-Front   | 192.168.2.50   | 77:88:99:AA:BB:CC | CAMERA | Hikvision | 90      | Security
```

## Import Behavior

### Override Logic
1. **Match by MAC Address**: If a device in the Excel file has a MAC address that matches an existing device, it will override that device
2. **Match by IP Address**: If no MAC match is found, the system checks for IP address match
3. **New Devices**: If neither MAC nor IP matches, the device is added as new

### Default Values
- **Confidence**: 100% (if not specified)
- **Network**: "Imported"
- **Detection Method**: "Excel Import"
- **Vendor**: "Unknown"
- **Last Seen**: Current timestamp

## How to Import

1. Navigate to **Inventory List** page
2. Click the **"Import Excel"** button (blue button with upload icon)
3. Select your Excel file (.xlsx, .xls, or .csv)
4. The system will:
   - Save current state for undo capability
   - Parse the file
   - Validate data
   - Override existing devices with matching MAC/IP
   - Add new devices
   - Show success message with counts (e.g., "Imported: 5 new, 3 updated")

## Undo Import

If you need to revert the import:
1. Click the **"Undo Import"** button (amber button with undo icon)
2. System restores devices to state before last import
3. The undo button only appears after a successful import
4. Only one level of undo is supported (last import only)

## Success Messages
- ✅ `Imported: X new, Y updated` - Shows breakdown of import operation
- ✅ `Device inventory updated` - Data synchronized across app
- ✅ `Restored to previous state` - Undo completed successfully

## Error Messages
- ❌ `Failed to parse Excel file. Check format.` - Invalid file structure or corrupted file

## Tips
- Use the first row for column headers
- MAC addresses can use colons (`:`) or hyphens (`-`) as separators
- IP addresses must be valid IPv4 or IPv6 format
- Confidence values should be between 0-100
- Leave cells empty if data is not available (default values will be used)

## Example Use Cases

### Bulk Update from Asset Management
Export your asset management system data to Excel and import to override existing device information with authoritative data.

### Add New Discovered Devices
Import devices discovered through external scanning tools that aren't in the RADAR system yet.

### Update Device Types
Export current devices, update types in Excel, and re-import to batch update classifications.
