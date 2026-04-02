import React, { useState, useEffect } from "react";
import { supabase } from "./utils/supabase";
import { UploadCloud } from "lucide-react";

const tapes = ["#fbd38d", "#9ae6b4", "#d6bcfa", "#90cdf4", "#feb2b2"];

export default function App() {
  const [skies, setSkies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // 1-second ticking clock
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  useEffect(() => {
    fetchSkies();

    // Subscribe to new uploads via Realtime
    const channel = supabase
      .channel("skies_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "skies" },
        (payload: any) => {
          setSkies((prev) => [payload.new, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchSkies() {
    try {
      const { data, error } = await supabase
        .from("skies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn(
          "Could not fetch skies automatically. Have you run the SQL block to setup the table?",
        );
        setSkies([]);
      } else {
        setSkies(data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Select an image first.");
    setUploading(true);

    try {
      // 1. Upload to Supabase Storage (requires a public 'sky_images' bucket)
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("sky_images")
        .upload(filePath, selectedFile);

      if (uploadError) {
        alert(
          "Storage error: Check if you created the sky_images bucket inside Supabase! \n" +
            uploadError.message,
        );
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("sky_images")
        .getPublicUrl(filePath);

      // 2. Insert record into Supabase Database
      const { data: newlyInsertedRows, error: dbError } = await supabase
        .from("skies")
        .insert([
          {
            image_url: publicUrlData.publicUrl,
            caption: caption || "Undefined sky",
          },
        ])
        .select();

      if (dbError) {
        alert(
          "Database Error: Check if you ran the SQL setup for the table! \n" +
            dbError.message,
        );
      } else if (newlyInsertedRows && newlyInsertedRows.length > 0) {
        // Update the gallery state instantly so receipt appears without refresh
        setSkies((prev) => [newlyInsertedRows[0], ...prev]);

        // reset layout
        setPreview(null);
        setSelectedFile(null);
        setCaption("");
      }
    } catch (err: any) {
      alert("Error uploading metadata: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="sky-background"></div>
      <div className="graph-background"></div>

      <div className="content-wrapper">
        <header className="top-navigation">
          <div className="nav-left">SYSTEM STATUS: READY TO PRINT</div>
          <div className="nav-right">TIMESTAMP: {formatTimestamp(now)}</div>
        </header>

        <section className="hero-section">
          <h1 className="primary-heading">How's the sky today?</h1>
          <p className="subtitle">Printed fresh from the atmosphere</p>

          <div className="upload-widget">
            <input
              type="file"
              id="sky-upload"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <label htmlFor="sky-upload">
              <div className="inner-drop-zone">
                {preview ? (
                  <img
                    src={preview}
                    style={{
                      maxHeight: 150,
                      borderRadius: 8,
                      marginBottom: "1rem",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <UploadCloud className="upload-icon" size={40} />
                    <div className="upload-text">Upload</div>
                    <div className="sub-upload-text">
                      Upload or drop your sky here
                    </div>
                  </div>
                )}
              </div>
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="caption-input"
              placeholder="Type a caption for your sky (e.g. Sunny day in London)"
            />
            <button
              className="action-button"
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
            >
              {uploading ? "Generating..." : "Generate Receipt"}
            </button>
          </div>
        </section>

        <section className="gallery-section">
          <h2 className="gallery-title">
            Live skies from all around the world
          </h2>
          <div className="gallery-grid">
            {loading ? (
              <p style={{ textAlign: "center", width: "100%" }}>
                Loading the globe...
              </p>
            ) : skies.length === 0 ? (
              <p style={{ textAlign: "center", width: "100%", opacity: 0.6 }}>
                No skies printed yet. Be the first!
              </p>
            ) : (
              skies.map((sky, index) => (
                <ReceiptCard key={sky.id || index} sky={sky} index={index} />
              ))
            )}
          </div>
        </section>
      </div>

      <footer className="footer-bar">
        <div className="footer-left">MADE WITH SKIES BY @dreamsyyy</div>
        <div className="footer-right">PRINTER STATUS: ONLINE</div>
      </footer>
    </>
  );
}

function ReceiptCard({ sky, index }: { sky: any; index: number }) {
  // Use React.useMemo to keep rotations stable across re-renders
  const rot = React.useMemo(() => (Math.random() * 6 - 3).toFixed(2), []);
  const tapeRot = React.useMemo(() => (Math.random() * 10 - 5).toFixed(2), []);
  const tapeColor = tapes[index % tapes.length];
  const delay = (index % 8) * 0.08;

  const shortTime = new Date(sky.created_at || Date.now()).toLocaleTimeString(
    [],
    { hour: "2-digit", minute: "2-digit" },
  );

  return (
    <div
      className="receipt-wrapper"
      style={
        {
          "--rot": `rotate(${rot}deg)`,
          animationDelay: `${delay}s`,
        } as React.CSSProperties
      }
    >
      <div className="receipt-card">
        <div
          className="washi-tape"
          style={
            {
              "--tape-rot": `${tapeRot}deg`,
              "--tape-color": tapeColor,
            } as React.CSSProperties
          }
        ></div>
        <img
          src={sky.image_url}
          alt={sky.caption}
          className="receipt-image"
          loading="lazy"
        />
        <div className="receipt-meta">
          <div className="receipt-timestamp">{shortTime}</div>
          <div className="receipt-title">{sky.caption}</div>
          <div className="receipt-subtext">
            Thank you for looking up.
            <br />
            No refund on bad weather.
          </div>
          <div className="receipt-barcode"></div>
        </div>
      </div>
    </div>
  );
}
