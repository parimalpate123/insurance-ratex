# UI Testing Guide: AI-Enhanced Mapping Features

## ✅ Setup Complete

All services are running:
- **Mapping UI**: http://localhost:8080
- **Orchestrator API**: http://localhost:3000
- **PostgreSQL**: Healthy with AI features schema
- **Routing**: Updated to use `NewMappingEnhanced` component

---

## Quick Start: Test the UI

### 1. Access the Application

Open your browser to: **http://localhost:8080**

You should see the InsurRateX mapping interface.

---

### 2. Create New Mapping (Enhanced UI)

Click the **"Create New Mapping"** button. You should now see the **Enhanced Creation Screen** with **4 creation methods**:

```
┌─────────────────────────────────────────┐
│   How would you like to create          │
│   this mapping?                          │
│                                          │
│  ┌──────────┐    ┌──────────┐          │
│  │ ✋ Start  │    │ 📝 Paste │          │
│  │  from     │    │   Text   │          │
│  │ Scratch  │    │Requirements│         │
│  └──────────┘    └──────────┘          │
│                                          │
│  ┌──────────┐    ┌──────────┐          │
│  │ 📊 Upload│    │ 🤖 AI-   │          │
│  │ Excel/CSV│    │ Powered  │          │
│  └──────────┘    └──────────┘          │
└─────────────────────────────────────────┘
```

---

## Test 1: Manual Creation (Existing Flow)

**Purpose:** Verify backward compatibility

### Steps:
1. Select **"✋ Start from Scratch (Manual)"**
2. Fill in metadata:
   - **Name**: "Test Manual Mapping"
   - **Source System**: "guidewire"
   - **Target System**: "cdm"
   - **Product Line**: "general-liability"
   - **Version**: "1.0"
   - **Description**: "Manual test mapping"

3. Click **"Create & Edit Mappings"**

### Expected Result:
✅ Navigates to the mapping editor (existing functionality)

---

## Test 2: Text Paste Feature (NEW! ⭐)

**Purpose:** Test AI parsing of natural language requirements

### Steps:
1. Click **"Create New Mapping"**
2. Select **"📝 Paste Text Requirements"**
3. Fill metadata (same as above)
4. In the **large text area** (12 rows), paste this sample text:

```
Map quoteNumber to policy.id
Map insured.name to insured.name
Map insured.state to insured.address.state using state code lookup
Map effectiveDate to policy.effectiveDate with date format conversion
Map premium to coverages[0].premium as direct mapping
```

5. Click **"Generate AI Suggestions"** button

### Expected Result:

1. **Loading spinner** appears with text "Generating AI suggestions..."
2. After **2-3 seconds**, a **full-screen preview modal** opens
3. Modal title: "Review AI Suggestions (5 found)"
4. Shows **5 mapping suggestions**:

```
┌──────────────────────────────────────────────────────────────┐
│  Review AI Suggestions (5 found)                             │
├──────────────────────────────────────────────────────────────┤
│  Source             Transform          Target           Action│
│                                                                │
│  quoteNumber    →   Direct      →   policy.id         ✓  ✗  │
│  [Badge: 95%]       [Icon: →]       Type: string            │
│  AI: "Clear direct mapping"                                  │
│                                                                │
│  insured.name   →   Direct      →   insured.name      ✓  ✗  │
│  [Badge: 95%]       [Icon: →]       Type: string            │
│  AI: "Direct field mapping with identical paths"            │
│                                                                │
│  insured.state  →   Lookup      →   insured.address   ✓  ✗  │
│                                        .state                 │
│  [Badge: 90%]       [Icon: 🔄]       Type: string            │
│  AI: "Explicit mapping with state code lookup specified"    │
│                                                                │
│  effectiveDate  →   Transform   →   policy.effective  ✓  ✗  │
│                                        Date                   │
│  [Badge: 90%]       [Icon: ⚙️]       Type: date              │
│  AI: "Date format conversion required"                       │
│                                                                │
│  premium        →   Direct      →   coverages[0]      ✓  ✗  │
│                                        .premium               │
│  [Badge: 95%]       [Badge: 95%]    Type: number            │
│  AI: "Direct premium mapping"                                │
└──────────────────────────────────────────────────────────────┘
```

5. **Test filtering**: Click filter dropdown → Select "High Confidence Only (≥80%)"
   - All 5 suggestions should remain visible (all are ≥90%)

6. **Test bulk actions**:
   - Click **"Accept All High Confidence (≥80%)"** → All 5 should be checked ✓
   - Or manually check/uncheck individual suggestions

7. Click **"Create Mapping"** button

### Expected Result:
✅ Editor opens with 5 pre-populated field mappings
✅ Can see source paths, target paths, transformation types

---

## Test 3: Excel/CSV Upload (NEW! ⭐)

**Purpose:** Test parsing of structured mapping files

### Steps:
1. Click **"Create New Mapping"**
2. Select **"📊 Upload Excel/CSV"**
3. Fill metadata (same format as above)
4. **Upload the test CSV file**:
   - File: `/Users/parimalpatel/code/rating-poc/test-mappings.csv`
   - You can either:
     - **Drag and drop** the file into the dropzone
     - Or **click** "Choose File" to browse

   The dropzone should show:
   ```
   ┌──────────────────────────────────┐
   │   📁                             │
   │   Drag and drop Excel/CSV file   │
   │   or click to browse             │
   │                                  │
   │   Supports: .xlsx, .xls, .csv    │
   │   Max size: 10 MB                │
   └──────────────────────────────────┘
   ```

5. After file is selected, you should see:
   ```
   Selected file: test-mappings.csv (204 bytes)
   ```

6. Click **"Generate AI Suggestions"**

### Expected Result:

1. Preview modal opens with **4 mappings** from CSV:

```
Source                  Transform    Target                      Confidence
──────────────────────────────────────────────────────────────────────────
quoteNumber         →   Direct   →  policy.id                   85% 🟡
insured.name        →   Direct   →  insured.name                95% 🟢
insured.state       →   Direct   →  insured.address.state       95% 🟢
classification.code →   Lookup   →  ratingFactors.businessType  90% 🟢
```

2. For the **lookup transformation**, hover or expand to see:
   ```json
   {
     "lookupTable": "state-class-mapping"
   }
   ```

3. **Statistics shown**:
   - Total Suggestions: 4
   - High Confidence (≥80%): 4
   - Average Confidence: 91.25%

4. Accept suggestions and click "Create Mapping"

### Expected Result:
✅ Editor opens with 4 pre-populated mappings from CSV

---

## Test 4: AI-Powered Schema Detection (NEW! ⭐)

**Purpose:** Test schema library and AI auto-suggestion

### Steps:
1. Click **"Create New Mapping"**
2. Select **"🤖 AI-Powered (Schema Detection)"**
3. Fill metadata with **dropdown selectors**:
   - **Source System**: Select **"guidewire"** (dropdown)
   - **Source Version**: Select **"v10.0"** (auto-populated from library)
   - **Target System**: Select **"cdm"**
   - **Target Version**: Select **"v2.0"**
   - **Product Line**: "general-liability"

4. You should see a **schema preview**:
   ```
   Source Schema: Guidewire v10.0
   - Fields: 8
   - Type: library

   Target Schema: CDM v2.0
   - Fields: 8
   - Type: library
   ```

5. Click **"Generate AI Suggestions"**

### Expected Result:

1. Preview modal shows **AI-generated mappings** based on schema analysis:

```
Source              Transform    Target                 Confidence  Reasoning
────────────────────────────────────────────────────────────────────────────
quoteNumber     →   Direct   →  policy.id              95%  🟢     "Both fields represent unique policy identifiers"
productCode     →   Lookup   →  policy.productLine     90%  🟢     "Product codes need standardization mapping"
insured.name    →   Direct   →  insured.name           100% 🟢     "Exact match in field path and semantics"
effectiveDate   →   Direct   →  policy.effectiveDate   95%  🟢     "Date fields with semantic alignment"
...
```

2. AI reasoning is shown for each suggestion
3. Transformation types auto-detected (direct, lookup, transform)
4. Confidence scores based on semantic similarity

5. Review and accept suggestions
6. Click "Create Mapping"

### Expected Result:
✅ Editor opens with AI-suggested field mappings
✅ High confidence mappings are accurate

---

## Test 5: Preview Modal Features

**Purpose:** Test all interactive features in the preview modal

### Features to Test:

#### 1. Confidence Filtering
- Click **filter dropdown** (top-right)
- Options:
  - "Show All"
  - "High Confidence Only (≥80%)"
  - "Medium Confidence Only (60-79%)"
- Verify filtering works correctly

#### 2. Confidence Badges (Color-coded)
- **Green badge (≥80%)**: High confidence
- **Yellow badge (60-79%)**: Medium confidence
- **Gray badge (<60%)**: Low confidence

#### 3. Transformation Type Icons
- **→** : Direct mapping
- **🔄** : Lookup/Reference table
- **⚙️** : Transformation/Conversion
- **🧮** : Calculation/Formula

#### 4. Bulk Actions
- **"Accept All High Confidence (≥80%)"**: Checks all suggestions ≥80%
- **"Accept All"**: Checks all suggestions
- Individual **✓** and **✗** buttons per row

#### 5. Navigation
- **"Back to Edit"**: Returns to creation form (data preserved)
- **"Create Mapping"**: Proceeds with checked suggestions only

#### 6. Expand/Collapse Details
- Click suggestion row to see:
  - Full AI reasoning
  - Sample values (if available)
  - Transformation configuration

---

## Test 6: Error Handling

**Purpose:** Verify validation and error messages

### Test Invalid File Type
1. Try uploading a `.txt` or `.pdf` file
2. **Expected**: Error message: "Invalid file type. Only Excel (.xlsx, .xls) and CSV files are supported."

### Test Empty Text
1. Select text paste method
2. Leave text area empty
3. Click "Generate AI Suggestions"
4. **Expected**: Error: "Please enter text requirements"

### Test File Too Large
1. Try uploading a file > 10MB
2. **Expected**: Error: "File size exceeds 10MB limit"

### Test Missing Metadata
1. Leave name/source/target fields blank
2. Try to generate suggestions
3. **Expected**: Validation errors on required fields

---

## Test 7: Backend API Verification

**Purpose:** Verify schema library is loaded

Open browser console (F12) and run:

```javascript
// Test 1: Schema Library
fetch('http://localhost:3000/api/v1/schemas/library')
  .then(r => r.json())
  .then(schemas => {
    console.log('✅ Schemas loaded:', schemas.length);
    console.table(schemas);
  });

// Test 2: Text Parsing
fetch('http://localhost:3000/api/v1/ai/mappings/parse-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Map quoteNumber to policy.id\nMap insured.name to insured.name'
  })
})
  .then(r => r.json())
  .then(result => {
    console.log('✅ Text parsed:', result.totalSuggestions, 'suggestions');
    console.table(result.suggestions);
  });
```

### Expected Console Output:

```
✅ Schemas loaded: 3

systemName    version   fieldCount   description
───────────────────────────────────────────────────────────────
guidewire     v10.0     8            Guidewire PolicyCenter v10.0...
cdm           v2.0      8            Canonical Data Model v2.0...
earnix        v8.0      6            Earnix Rating Engine v8.0...

✅ Text parsed: 2 suggestions

sourcePath     targetPath      transformationType  confidence
────────────────────────────────────────────────────────────
quoteNumber    policy.id       direct              95
insured.name   insured.name    direct              95
```

---

## Troubleshooting

### Issue: Preview Modal Doesn't Open

**Check:**
```bash
# 1. Verify orchestrator is running
curl http://localhost:3000/health

# 2. Check orchestrator logs
docker-compose logs orchestrator | tail -50

# 3. Check for JavaScript errors
# Open browser console (F12) → Console tab
```

### Issue: "Network Error" or "Failed to Fetch"

**Fix:**
```bash
# Restart orchestrator
docker-compose restart orchestrator

# Wait 10 seconds, then test
sleep 10
curl http://localhost:3000/api/v1/schemas/library
```

### Issue: Old UI Still Appears

**Fix:**
```bash
# Hard refresh browser
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R

# Or clear cache and reload
```

### Issue: AI Suggestions Not Generated

**Check AWS Bedrock config:**
```bash
docker-compose exec orchestrator env | grep -E '(AWS|BEDROCK|ENABLE_AI)'
```

Should show:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAYAZW6CZM45VG44GH
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
ENABLE_AI_FEATURES=true
```

---

## Summary of UI Changes

### ✅ New Components Created:
1. **NewMappingEnhanced.tsx** - 4 creation methods (Manual, Text, Excel, AI)
2. **FileUploader.tsx** - Drag-and-drop file upload component
3. **MappingPreviewModal.tsx** - Full-screen review modal with filtering

### ✅ New API Clients:
1. **ai-mappings.ts** - parseTextRequirements, parseExcelFile, generateSuggestions
2. **schemas.ts** - getSchemaLibrary, getSchemaById

### ✅ Routing Updated:
- **App.tsx** now uses `NewMappingEnhanced` instead of old `NewMapping`

### ✅ TypeScript Issues Fixed:
- Added `vite-env.d.ts` for import.meta.env type support
- Fixed unused variable warnings
- Fixed undefined checks

---

## Next Steps After Testing

1. ✅ If all tests pass → **Production ready!**
2. Create sample mappings using all 4 methods
3. Test with real Guidewire payloads
4. Train business analysts on new workflows
5. Monitor AI suggestion accuracy
6. Collect feedback for improvements

---

## Quick Reference

**Access Points:**
- UI: http://localhost:8080
- API: http://localhost:3000
- Health: http://localhost:3000/health

**Test Files:**
- CSV: `/Users/parimalpatel/code/rating-poc/test-mappings.csv`
- Results: `/Users/parimalpatel/code/rating-poc/TEST_RESULTS.md`

**Key Features:**
- ✨ 4 creation methods (Manual, Text, Excel, AI)
- 🤖 AI-powered suggestions via AWS Bedrock
- 📊 Confidence scoring (color-coded)
- 🔍 Interactive preview modal
- 📚 Pre-loaded schema library (3 schemas)
- ✅ Fully tested backend (all endpoints working)

---

**Happy Testing! 🎉**
