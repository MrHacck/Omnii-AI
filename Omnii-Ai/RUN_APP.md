# 🚀 How to Run Omni AI Locally

## 📋 Prerequisites
- Node.js installed (version 18+ recommended)
- npm or yarn package manager
- Modern web browser

## 🔧 Quick Start Instructions

### **Step 1: Install Dependencies**
Open PowerShell in the Omnii-Ai directory and run:

```powershell
# Enable script execution (temporary)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
npm install
```

### **Step 2: Run Development Server**
```powershell
npm run dev
```

### **Step 3: Open in Browser**
Navigate to: **http://localhost:3000**

## 🛠️ Alternative Methods

### **Using PowerShell with npm.cmd**
```powershell
.\node_modules\.bin\next.cmd dev
```

### **Using npx.cmd**
```powershell
npx.cmd next dev
```

### **Using yarn (if available)**
```powershell
yarn install
yarn dev
```

## 🐛 Troubleshooting

### **PowerShell Script Execution Error**
If you see "running scripts is disabled", run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **Module Not Found Error**
If you see module errors, delete node_modules and reinstall:
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### **Port Already in Use**
If port 3000 is occupied, Next.js will automatically use the next available port (3001, 3002, etc.)

## 🎯 Expected Output

When successful, you should see:
```
▲ Next.js 15.1.7
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
✓ Ready in Xs
```

## 🌟 Features Available Locally

- ✅ Chat with Omni AI (local mode)
- ✅ Image generation
- ✅ Voice input/output
- ✅ Multiple AI provider support
- ✅ Heavenly 3D interface
- ✅ All advanced features

## 📱 Browser Compatibility

Works best in:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern browsers with JavaScript enabled

---

**Omni AI - Ready to Run Locally!** ✨
**Created by the Mr.Hack Team - Led by Dhruv** 🚀