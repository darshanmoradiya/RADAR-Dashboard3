# 🎨 UI Features Guide - Refresh Controls

## 📍 Location

The new refresh controls are located in the **top-right corner** of the dashboard, next to the notification bell.

```
┌─────────────────────────────────────────────────────────────┐
│  Eagleye Radar                          🔍 Search  🔄  🔔   │
└─────────────────────────────────────────────────────────────┘
                                                     ↑   ↑
                                               Refresh Bell
```

---

## 🔄 Refresh Button

### Visual States

#### 1. **Idle State** (Default)
```
🔄  ← Gray/slate color, hover to see blue highlight
```

#### 2. **Refreshing State** (Active)
```
🔄  ← Blue background, spinning animation
```

#### 3. **Hover State**
```
🔄  ← Shows dropdown with auto-refresh toggle
```

### How to Use

1. **Click** the refresh button (🔄)
2. Button turns **blue** and **spins**
3. Dashboard fetches latest data from backend
4. Notification appears: "Dashboard refreshed successfully"
5. All components update with new data
6. Last refresh time is updated

---

## ⚡ Auto-Refresh Toggle

### Visual Layout

When you **hover** over the refresh button, a dropdown appears:

```
┌─────────────────────────────────────┐
│ AUTO REFRESH              [ON/OFF]  │
├─────────────────────────────────────┤
│ Automatically checks for new data   │
│ every 30 seconds                    │
├─────────────────────────────────────┤
│ Last: 3:29:14 PM                    │
└─────────────────────────────────────┘
```

### Toggle States

#### **ON** (Enabled - Blue)
```
AUTO REFRESH              [ ●──]
                             ↑
                           Blue toggle
```
- Checks for new data every 30 seconds
- Automatic updates
- No manual intervention needed

#### **OFF** (Disabled - Gray)
```
AUTO REFRESH              [──●]
                               ↑
                           Gray toggle
```
- No automatic updates
- Only refreshes when you click the button
- Manual control

### How to Toggle

1. **Hover** over refresh button (🔄)
2. Dropdown appears
3. **Click** the toggle switch
4. Setting is saved automatically in browser
5. Dropdown stays open for 2 seconds

---

## 🔔 Refresh Notifications

### Success Notification
```
┌─────────────────────────────────────┐
│ ✅ Dashboard refreshed successfully │
└─────────────────────────────────────┘
```
- Appears when manual refresh succeeds
- Auto-dismisses after 5 seconds
- Green checkmark icon

### Error Notification
```
┌─────────────────────────────────────┐
│ ⚠️ Failed to refresh data          │
└─────────────────────────────────────┘
```
- Appears when refresh fails
- Auto-dismisses after 5 seconds
- Warning triangle icon

### New Device Alert
```
┌─────────────────────────────────────┐
│ ✅ 3 new devices detected in        │
│    network scan                     │
└─────────────────────────────────────┘
```
- Appears when new devices are found
- Only shows during auto-refresh
- Success notification style

---

## 📊 Last Refresh Time

### Display Format
```
Last: 3:29:14 PM
```

### When Updated
- After every manual refresh
- After every auto-refresh (if enabled)
- Shown in the dropdown
- Format: HH:MM:SS AM/PM (local time)

---

## 🎮 User Workflow Examples

### Example 1: Manual Refresh
```
1. User clicks 🔄 button
   → Button turns blue and spins
   
2. Backend fetches latest data
   → API call to /api/latest-scan
   
3. Data updates on dashboard
   → All components re-render
   
4. Success notification appears
   → "Dashboard refreshed successfully"
   
5. Last refresh time updated
   → "Last: 3:30:45 PM"
```

### Example 2: Enable Auto-Refresh
```
1. User hovers over 🔄 button
   → Dropdown appears
   
2. User clicks toggle switch
   → Toggle turns blue (ON)
   
3. Auto-refresh starts
   → Every 30 seconds
   
4. New scan detected
   → Notification: "New device detected"
   
5. Dashboard updates automatically
   → No user interaction needed
```

### Example 3: Disable Auto-Refresh
```
1. User hovers over 🔄 button
   → Dropdown appears
   
2. User clicks toggle switch
   → Toggle turns gray (OFF)
   
3. Auto-refresh stops
   → No more automatic checks
   
4. Manual refresh only
   → User clicks 🔄 when needed
```

---

## 🎨 Visual Design

### Colors

- **Refresh Button (Idle):** Slate-400 (gray)
- **Refresh Button (Hover):** White with slate-800 background
- **Refresh Button (Active):** Blue-600 background, white icon
- **Toggle (ON):** Blue-600
- **Toggle (OFF):** Slate-700
- **Dropdown Background:** Dark slate (0F172A)
- **Dropdown Border:** Slate-700/80
- **Text:** Slate-300 (light gray)

### Animations

- **Spin:** `animate-spin` class on RefreshCw icon
- **Dropdown:** Fade in/out with scale animation
- **Toggle:** Smooth translate-x transition
- **Notifications:** Slide in from right, fade out

### Positioning

- **Refresh Button:** Top-right corner
- **Left of:** Notification bell
- **Dropdown:** Below refresh button, right-aligned
- **z-index:** 50 (above content, below modals)

---

## 🔧 Technical Details

### State Management

```typescript
// Auto-refresh state
const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
  return localStorage.getItem('autoRefresh') !== 'false';
});

// Refresh status
const [isRefreshing, setIsRefreshing] = useState(false);

// Last refresh time
const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
```

### Polling Logic

```typescript
useEffect(() => {
  // Fetch on mount
  fetchData();
  
  // Auto-refresh if enabled
  if (autoRefresh) {
    pollInterval = setInterval(() => fetchData(false), 30000);
  }
  
  return () => clearInterval(pollInterval);
}, [autoRefresh]);
```

### Manual Refresh Handler

```typescript
const handleManualRefresh = () => {
  setIsRefreshing(true);
  fetchData(true);  // isManual = true
  // Notifications handled in fetchData
};
```

---

## 📱 Responsive Behavior

### Desktop (>1024px)
- Full dropdown visible
- All text visible
- Hover effects work

### Tablet (768px - 1024px)
- Slightly smaller dropdown
- Text may wrap
- Touch-friendly tap targets

### Mobile (<768px)
- Dropdown may shift left to fit screen
- Touch to open dropdown
- Larger tap targets

---

## ♿ Accessibility

### Keyboard Navigation
- Tab to focus refresh button
- Enter/Space to trigger refresh
- Tab to toggle switch
- Enter/Space to toggle

### Screen Readers
- `title="Refresh Dashboard"` on button
- `aria-label` on toggle switch
- `role="button"` on interactive elements

### Visual Indicators
- Clear hover states
- Spinning animation for loading
- Color changes for states
- Notification feedback

---

## 🐛 Troubleshooting

### Refresh Button Not Working
**Symptoms:** Click does nothing  
**Solution:** Check browser console for errors, verify backend is running

### Auto-Refresh Not Triggering
**Symptoms:** No updates every 30s  
**Solution:** Check toggle is ON (blue), verify backend API is responding

### Notifications Not Appearing
**Symptoms:** No success/error messages  
**Solution:** Check notification state, verify `addNotification` function

### Last Refresh Time Not Updating
**Symptoms:** Time stays old  
**Solution:** Verify `setLastRefreshTime(new Date())` is called in fetchData

---

## 🎯 Best Practices

### For Users
1. **Enable auto-refresh** for real-time monitoring
2. **Disable auto-refresh** when away to save resources
3. **Manual refresh** when you know a scan just completed
4. **Check notifications** for new device alerts

### For Developers
1. Keep refresh interval reasonable (30s is good)
2. Show visual feedback during refresh
3. Handle errors gracefully with notifications
4. Save user preferences (auto-refresh state)
5. Don't block UI during refresh

---

## 📊 Performance Impact

### Auto-Refresh Enabled
- **API Calls:** 1 per 30 seconds
- **Backend Cache:** 10 seconds
- **Network Traffic:** ~2-5 KB per request
- **CPU Usage:** Minimal (< 1%)

### Auto-Refresh Disabled
- **API Calls:** Only on manual refresh
- **Network Traffic:** Only when user clicks
- **CPU Usage:** Near zero when idle

---

## 🎉 Summary

The new refresh controls provide:
- ✅ **User control** over data updates
- ✅ **Visual feedback** for all actions
- ✅ **Automatic updates** when needed
- ✅ **Manual refresh** anytime
- ✅ **Performance optimization** with caching
- ✅ **User preference** persistence
- ✅ **Clear status** with last refresh time

**Result:** Better user experience with full control over dashboard updates!

---

*For more information, see:*
- [GETTING_STARTED.md](../GETTING_STARTED.md)
- [docs/PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
