```markdown

# Product Requirements Document (PRD): DealHunter MVP




## 1. The One-Line Pitch

> "A hyperlocal, community-fed feed of currently active restaurant deals, sorted by distance."

> **Think:** "TikTok for Happy Hours"



---



## 2. The "Zero-Dollar" Tech Stack



* **Framework:** **Next.js 14+ (App Router)**

    * *Why:* Free hosting on Vercel, built-in API routes, best PWA support.

* **Database:** **Supabase (PostgreSQL)**

    * *Why:* Built-in PostGIS (Geo-search), Auth, and Storage. Generous free tier (500MB).

* **AI Engine:** **Google Gemini 1.5 Flash**

    * *Why:* Currently Free-of-charge (within rate limits) and reads text from images perfectly.

* **CSS:** Tailwind CSS.

* **Icons:** Lucide React.



---



## 3. Core Features (Scope)



### 3.1 The "Nearby Feed" (Viewer)

**Concept:** No Map. No pins. Just a vertical scroll list.



**Logic:**

1.  User grants location permission.

2.  App sends `(Lat, Long)` to Supabase.

3.  Database returns deals where:

    * `current_time` is inside the deal window.

    * `AND` distance is < 5km.

4.  **Sorting:** By Distance (Nearest First).



**UI Card Elements:**

* **Food Photo:** Aspect Ratio 4:3.

* **Title:** "$5 Margaritas" (Bold).

* **Venue:** "Bar Louie" (Grey).

* **Live Status:** "🟢 Active Now" or "🔴 Ends in 15m".

* **Distance:** "0.2 mi".



### 3.2 The "Snap-to-Deal" (Contributor)

**Input:** Camera Button (FAB - Floating Action Button).



**Process:**

1.  User snaps photo of a menu/chalkboard.

2.  Image uploads to **Supabase Storage** (tmp bucket).

3.  Next.js API sends URL to **Gemini Flash**.

4.  **Gemini Prompt:** *"Extract title, price, start_time, end_time, days. Return JSON."*

5.  **Verification Modal:** User sees the extracted text and clicks "Confirm."

6.  Deal is saved to DB.



### 3.3 The "Navigation" (Action)

* **Feature:** Every card has a "Get Directions" button.

* **Behavior:** Deep link that opens the native Google Maps app on the user's phone.

* **Link Format:** `https://www.google.com/maps/dir/?api=1&destination=LAT,LONG`



---



## 4. Data Dictionary (Schema)



You need exactly 3 Tables. Run this SQL in Supabase:



```sql

-- Table 1: Restaurants

CREATE TABLE restaurants (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name text NOT NULL,

  location geography(POINT) NOT NULL, -- Crucial for distance sorting

  address text,

  created_by uuid DEFAULT auth.uid()

);



-- Table 2: Deals

CREATE TABLE deals (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  restaurant_id uuid REFERENCES restaurants(id),

  title text NOT NULL,

  description text,

  start_time time NOT NULL, -- e.g. 17:00

  end_time time NOT NULL,   -- e.g. 20:00

  days_active int[] NOT NULL, -- e.g. [1,2,3] for Mon, Tue, Wed

  image_url text,

  upvotes int DEFAULT 0,

  is_active boolean DEFAULT true

);



-- Table 3: Votes (Prevent Spam)

CREATE TABLE votes (

  deal_id uuid REFERENCES deals(id),

  device_id text NOT NULL, -- From LocalStorage

  vote_type int CHECK (vote_type IN (1, -1)),

  PRIMARY KEY (deal_id, device_id)

);



```



---



## 5. The "Hack" Plan (4 Weeks)



### Week 1: The "Dirty" Feed (Manual Data)



**Goal:** A list that shows something.



* [ ] `npx create-next-app`

* [ ] Setup Supabase project.

* [ ] Write the `get_nearby_deals` SQL function (RPC).

* [ ] **Manual Labor:** Founder goes to 5 bars, takes photos, and manually inserts rows via Table Editor.

* [ ] Build Frontend Feed to display these 5 rows.



### Week 2: The AI Camera



**Goal:** Replace manual SQL entry with the Camera button.



* [ ] Build `<input type="file" capture="environment" />` component.

* [ ] Get Google Gemini API Key.

* [ ] Write the API Route (`/api/analyze-image`) to handle the OCR.

* [ ] Connect it to the frontend "Confirm" modal.



### Week 3: Polish & PWA



**Goal:** Make it feel like an app.



* [ ] Add `manifest.json` (Logo, App Name).

* [ ] Add "Pull to Refresh" on the feed.

* [ ] Add "Skeleton Loaders" (Grey boxes while data loads).



### Week 4: The "Growth" Launch



**Goal:** Get users.



* [ ] Print 20 Stickers with a QR code pointing to your URL.

* [ ] **Guerrilla Marketing:** Stick them inside the bathrooms of the bars you listed.

* [ ] **Caption:** *"See what's on Happy Hour right now. Scan this."*



---



## 6. Technical "Gotchas" (Read Before Coding)



**1. Image Sizing**



* **Problem:** Users take 4K photos (5MB). You have 500MB total storage.

* **Solution:** Use `browser-image-compression` library in React before uploading. Resize everything to max 1024px width.



**2. Timezones**



* **Problem:** Databases store time in UTC. Your users are local.

* **Solution:** Store times as "Local Time" (e.g., `17:00:00` without timezone). When querying "Is it active now?", cast the user's current time to a simple time string.



**3. Location Denied**



* **Problem:** If a user denies GPS, the app breaks.

* **Solution:** Hardcode a "Default Location" (e.g., your university campus or downtown center) so the feed is never empty.



```

