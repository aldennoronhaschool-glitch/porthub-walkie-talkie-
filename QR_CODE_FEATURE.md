# QR Code Friend Request Feature

## Overview
Users can now add friends using QR codes in addition to manual PIN entry. Each user has a unique QR code that encodes their PIN, making it easy to add friends in person.

## Features Implemented

### 1. **Three Ways to Add Friends**
When users tap the "+" icon to add friends, they now see three options:

#### Option 1: Manual PIN Entry
- Enter friend's PIN manually (e.g., `A3F7-K9M2`)
- Same as before, but with improved UI

#### Option 2: Scan QR Code
- Opens mobile camera to scan friend's QR code
- Automatically extracts PIN and sends friend request
- Uses `html5-qrcode` library for reliable scanning
- Works on all modern mobile browsers

#### Option 3: View My QR Code
- Displays user's own QR code
- Shows PIN below the QR code
- Includes "Share QR Code" button

### 2. **QR Code Sharing**
Users can share their QR code in two ways:
- **Mobile devices with share API**: Opens native share sheet to share via WhatsApp, Telegram, etc.
- **Desktop/fallback**: Downloads QR code as PNG image

### 3. **Enhanced UI/UX**
- Clean "OR" divider between manual entry and QR options
- Two beautiful cards for "Scan QR" and "My QR" options
- Smooth transitions between different modes
- Consistent with the existing dark theme design

## Technical Implementation

### New Dependencies
```json
{
  "qrcode.react": "^4.1.0",
  "html5-qrcode": "^2.3.8"
}
```

### New Component
- **`QRCodeScanner.tsx`**: Handles camera access and QR code scanning
  - Uses `html5-qrcode` for robust scanning
  - Full-screen overlay with camera preview
  - Error handling for camera permissions
  - Auto-stops camera when QR is detected

### Updated Component
- **`Room.tsx` - AddFriendView**: Enhanced with three modes
  - `input`: Manual PIN entry (default)
  - `scan`: QR code scanner
  - `myqr`: Display and share user's QR code

## User Flow

### Scenario 1: Scanning a Friend's QR Code
1. User A taps "+" to add friend
2. User A taps "Scan QR" card
3. Camera opens with QR scanner overlay
4. User A points camera at User B's QR code
5. QR code is detected and decoded
6. Friend request is automatically sent
7. Returns to dashboard

### Scenario 2: Sharing Your QR Code
1. User A taps "+" to add friend
2. User A taps "My QR" card
3. QR code is displayed with PIN
4. User A taps "Share QR Code"
5. Native share sheet opens (or downloads on desktop)
6. User A shares via WhatsApp/Telegram/etc.

### Scenario 3: Manual PIN Entry (Original Method)
1. User A taps "+" to add friend
2. User A enters PIN manually
3. User A taps "Send Friend Request"
4. Friend request is sent

## QR Code Format
- **Data**: User's PIN (e.g., `A3F7-K9M2`)
- **Error Correction**: High (Level H)
- **Size**: 256x256 pixels
- **Format**: SVG (for display), PNG (for sharing)

## Browser Compatibility
- ✅ Chrome/Edge (mobile & desktop)
- ✅ Safari (iOS & macOS)
- ✅ Firefox (mobile & desktop)
- ✅ Samsung Internet
- ⚠️ Requires HTTPS for camera access (except localhost)

## Security Considerations
- QR codes only contain the public PIN (same as manual sharing)
- Camera access requires user permission
- No sensitive data is encoded in QR codes
- Same security model as existing PIN-based friend requests

## Future Enhancements
- [ ] Add QR code to Settings page for quick access
- [ ] Add QR code to Dashboard (small widget)
- [ ] Support for batch friend requests via QR
- [ ] QR code customization (colors, logo)
- [ ] Analytics for QR code scans

## Testing
1. Open app on two devices
2. Device A: Go to Add Friend → My QR
3. Device B: Go to Add Friend → Scan QR
4. Device B scans Device A's QR code
5. Verify friend request is sent and received
6. Test share functionality on mobile
7. Test fallback download on desktop

Enjoy the new QR code feature! 🎉
