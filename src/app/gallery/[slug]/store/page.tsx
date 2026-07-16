"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, User, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import DynamicMockup from "@/components/store/DynamicMockup";

export default function Storefront() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [gallery, setGallery] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [heroImage, setHeroImage] = useState<string | undefined>(undefined);

  const categories = ["Prints", "Wall Art", "Cards", "Albums & Books"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resGal = await fetch(`/api/galleries/${slug}?public=true`);
        const dataGal = await resGal.json();
        if (dataGal.success && dataGal.data) {
          setGallery(dataGal.data);
          setCompanyName(dataGal.companyName || "C. R MARK PHOTOGRAPHY");
          if (dataGal.media && dataGal.media.length > 0) {
            setHeroImage(dataGal.media[0].Url);
          }

          const resProd = await fetch(`/api/store/products?userId=${dataGal.data.User_ID}`);
          const dataProd = await resProd.json();
          if (dataProd.success) {
            setProducts(dataProd.data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Store...</div>;
  if (!gallery) return <div style={{ padding: "4rem", textAlign: "center" }}>Store not found.</div>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fdfdfd", color: "#333", fontFamily: "'Inter', sans-serif" }}>
      {/* Sticky Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid #eaeaea", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h1 style={{ fontSize: "0.875rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, margin: 0, color: "#111" }}>
            {gallery.Client_Name || gallery.Title} / {companyName}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
          <Link href={`/gallery/${slug}/store`} style={{ color: "#111", textDecoration: "none" }}>PRINT STORE</Link>
          <Link href={`/gallery/${slug}`} style={{ color: "#666", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <ArrowLeft size={16} /> VIEW GALLERY
          </Link>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#111", display: "flex", alignItems: "center" }}>
            <ShoppingCart size={18} />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#111", display: "flex", alignItems: "center" }}>
            <User size={18} />
          </button>
        </div>
      </header>

      {/* Hero / Categories Nav */}
      <div style={{ padding: "4rem 2rem 2rem 2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "2.5rem", fontWeight: 300, letterSpacing: "0.05em", color: "#111", marginBottom: "2rem" }}>Print Store</h2>
        
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap", fontSize: "0.875rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          <span style={{ color: "#999" }}>CATEGORIES:</span>
          {categories.map((cat, idx) => {
            const hasProducts = products.some(p => p.Category === cat);
            if (!hasProducts) return null;
            return (
              <a key={cat} href={`#${cat.replace(/ /g, '-')}`} style={{ color: "#111", textDecoration: "none", position: "relative" }}>
                {cat}
                {idx < categories.length - 1 && <span style={{ marginLeft: "2rem", color: "#eaeaea" }}>|</span>}
              </a>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem 4rem 2rem", display: "flex", flexDirection: "column", gap: "5rem" }}>
        {categories.map((cat) => {
          const catProducts = products.filter(p => p.Category === cat);
          if (catProducts.length === 0) return null;

          return (
            <section key={cat} id={cat.replace(/ /g, '-')}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 400, letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid #eaeaea", paddingBottom: "1rem", marginBottom: "2rem", color: "#111", textAlign: "center" }}>
                {cat}
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "3rem" }}>
                {catProducts.map((product) => (
                  <div key={product.Product_ID} className="group" style={{ cursor: "pointer", transition: "transform 0.2s ease" }}>
                    <div style={{ aspectRatio: "4/5", backgroundColor: "#f5f5f5", overflow: "hidden", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <DynamicMockup 
                        frameUrl={product.Image_Url}
                        photoUrl={heroImage}
                        productName={product.Name}
                        insetTopBottom={product.Category === "Prints" ? "0%" : "12%"}
                        insetLeftRight={product.Category === "Prints" ? "0%" : "12%"}
                      />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.5rem 0", color: "#111" }}>{product.Name}</h4>
                      <p style={{ fontSize: "0.875rem", color: "#666", margin: 0 }}>From CA${Number(product.Base_Price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {products.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>
            No products available at the moment.
          </div>
        )}
      </main>
    </div>
  );
}
