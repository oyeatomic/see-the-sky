# Skies - Printed Fresh ☁️

A beautiful, production-ready React web application that lets anyone in the world share photos of the sky. The application utilizes a physical "skeuomorphic" design style to render uploaded photos as jagged paper receipts printed fresh from the atmosphere!

This application connects to a live **Supabase** backend to handle real-time database synchronization and global cloud storage for uploaded images.

## 🚀 Tech Stack
- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Backend/Database**: [Supabase](https://supabase.com) (Storage & PostgreSQL)
- **Styling**: Pure CSS combined with variables, CSS Grids, and Flexbox

---

## 🛠️ Step 1: Frontend Setup

To run the project locally on your machine:

1. Open your terminal in the project root directory.
2. Install the necessary Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔌 Step 2: Connect to Supabase

The application requires an active Supabase project to store photos and load the global gallery.

1. Create a free account at [Supabase.com](https://supabase.com).
2. Create a new Organization and Project.
3. Access your **Project Settings** -> **API** to locate your keys.
4. Create a new file in the root of the project named exactly `.env`.
5. Paste your URL and Anon/Publishable Key inside like this:
   ```env
   VITE_SUPABASE_URL=https://your-project-url.supabase.co
   VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-long-anon-api-string
   ```

*(Note: The actual `.env` file should never be uploaded to GitHub to protect your keys. It is ignored by default).*

---

## 🗄️ Step 3: Supabase SQL Setup

To prevent "Database Errors" when you attempt to upload an image in the UI, you MUST configure the tables and storage buckets in Supabase safely to accept public input. 

Instead of configuring these via the UI, simply copy and run the SQL below:

1. Inside your Supabase Dashboard, click on the **SQL Editor** shortcut (the `>_` terminal icon on the far left rail).
2. Click **New Query**.
3. Paste the following SQL script exactly over whatever is there:

```sql
-- 1. Create the database table for our uploaded skies
CREATE TABLE skies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  image_url text NOT NULL,
  caption text NOT NULL
);

-- 2. Create the storage bucket for the physical images
insert into storage.buckets (id, name, public) 
values ('sky_images', 'sky_images', true);

-- 3. Turn on Database permissions to allow public uploading safely without a login portal
ALTER TABLE skies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads" ON skies FOR SELECT USING (true);
CREATE POLICY "Public inserts" ON skies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public storage view" ON storage.objects FOR SELECT USING ( bucket_id = 'sky_images' );
CREATE POLICY "Public storage uploads" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'sky_images' );
```
4. Click the **Run** button on the bottom right. Once it says "Success", the database is ready!

---

## 🎨 How to Update or Customize

- **Visuals & Design**: All style rules, including the animated jagged mask-edges, glass-morphism inputs, barcode generations, and backgrounds, are cleanly located inside `src/index.css`.
- **Application Logic**: Event handling (file upload logic), resizing via canvas, and talking directly to the Supabase client are situated inside `src/App.tsx`.
- **Supabase Integration**: The pure client linkage code sits in `src/utils/supabase.ts`.

Enjoy printing the sky! ⛅
