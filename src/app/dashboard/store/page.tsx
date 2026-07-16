"use client";

import { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Trash2, Edit3, X, DollarSign } from "lucide-react";

export default function StoreDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Prints");
  const [basePrice, setBasePrice] = useState("0.00");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const categories = ["Prints", "Wall Art", "Cards", "Albums & Books"];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/store/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product?: any) => {
    if (product) {
      setEditingId(product.Product_ID);
      setName(product.Name);
      setCategory(product.Category);
      setBasePrice(product.Base_Price.toString());
      setDescription(product.Description || "");
      setImageUrl(product.Image_Url || "");
    } else {
      setEditingId(null);
      setName("");
      setCategory("Prints");
      setBasePrice("0.00");
      setDescription("");
      setImageUrl("");
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingId ? `/api/store/products/${editingId}` : "/api/store/products";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: name,
          Category: category,
          Base_Price: parseFloat(basePrice) || 0,
          Description: description,
          Image_Url: imageUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`/api/store/products/${id}`, { method: "DELETE" });
      setProducts(products.filter(p => p.Product_ID !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploading(true);
    try {
      const res = await fetch('/api/store/products/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', data.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.onload = () => {
          if (xhr.status === 200) resolve();
          else reject(new Error('Upload failed'));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });

      setImageUrl(data.publicUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Loading store products...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#0f172a", margin: 0 }}>Print Store</h1>
        <button 
          onClick={() => openModal()}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#0f172a", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer" }}
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div style={{ backgroundColor: "white", padding: "4rem 2rem", borderRadius: "1rem", border: "1px dashed #cbd5e1", textAlign: "center" }}>
          <DollarSign size={48} style={{ margin: "0 auto 1rem auto", color: "#cbd5e1" }} />
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", margin: "0 0 0.5rem 0" }}>Your store is empty</h3>
          <p style={{ color: "#64748b", margin: "0 0 1.5rem 0" }}>Add products like prints and canvases to sell to your clients.</p>
          <button 
            onClick={() => openModal()}
            style={{ backgroundColor: "white", color: "#0f172a", border: "1px solid #0f172a", padding: "0.5rem 1.5rem", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer" }}
          >
            Create First Product
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {categories.map(cat => {
            const catProducts = products.filter(p => p.Category === cat);
            if (catProducts.length === 0) return null;
            return (
              <div key={cat}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#334155", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem" }}>
                  {cat}
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
                  {catProducts.map(product => (
                    <div key={product.Product_ID} style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                      <div style={{ height: "180px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        {product.Image_Url ? (
                          <img src={product.Image_Url} alt={product.Name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <ImageIcon size={32} color="#94a3b8" />
                        )}
                        <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", display: "flex", gap: "0.5rem" }}>
                          <button onClick={() => openModal(product)} style={{ backgroundColor: "white", border: "none", padding: "0.5rem", borderRadius: "0.5rem", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", color: "#3b82f6" }}>
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDelete(product.Product_ID)} style={{ backgroundColor: "white", border: "none", padding: "0.5rem", borderRadius: "0.5rem", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", color: "#ef4444" }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div style={{ padding: "1rem" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#0f172a", margin: "0 0 0.25rem 0" }}>{product.Name}</h3>
                        <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0 0 0.5rem 0" }}>From CA${Number(product.Base_Price).toFixed(2)}</p>
                        {product.Description && <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.Description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "1rem", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>{editingId ? "Edit Product" : "New Product"}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Product Name *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }} />
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Base Price ($) *</label>
                <input required type="number" step="0.01" value={basePrice} onChange={e => setBasePrice(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Description (Optional)</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Image URL</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." style={{ flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }} />
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 1rem", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "0.5rem", cursor: isUploading ? "not-allowed" : "pointer" }}>
                    <input type="file" accept="image/*" onChange={e => handleUploadFiles(e.target.files)} style={{ display: "none" }} disabled={isUploading} />
                    {isUploading ? "..." : "Upload"}
                  </label>
                </div>
                {imageUrl && <div style={{ marginTop: "0.5rem", width: "100px", height: "100px", borderRadius: "0.5rem", overflow: "hidden" }}><img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", background: "white", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={isSaving} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "none", background: "#0f172a", color: "white", fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer" }}>{isSaving ? "Saving..." : "Save Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
