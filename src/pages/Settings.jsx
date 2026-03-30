import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Moon, Sun, Upload, Trash2, ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATE_CODES, getStateNameByCode } from "@/lib/stateCodes";

export default function Settings() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        companyName: "",
        address: "",
        gstin: "",
        invoicePrefix: "",
        state: "",
        stateCode: "",
        bankName: "",
        accountNo: "",
        ifsc: "",
        branch: "",
        signatureDataUrl: "",
        bannerDataUrl: "",
    });

    const signatureInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    const handleBannerUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError("Invalid file type. Please upload a PNG, JPEG, or WebP image.");
            e.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("File too large. Maximum size is 5MB.");
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_W = 800, MAX_H = 200;
                let w = img.width, h = img.height;
                // Smart resize: scale down proportionally, never stretch up
                if (w > MAX_W) { h = h * (MAX_W / w); w = MAX_W; }
                if (h > MAX_H) { w = w * (MAX_H / h); h = MAX_H; }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                // Use high-quality image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/png', 0.95);
                setFormData(prev => ({ ...prev, bannerDataUrl: dataUrl }));
                if (success) setSuccess("");
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const removeBanner = () => {
        setFormData(prev => ({ ...prev, bannerDataUrl: "" }));
        if (success) setSuccess("");
    };

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError("Invalid file type. Please upload a PNG, JPEG, or WebP image.");
            e.target.value = '';
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError("File too large. Maximum size is 2MB.");
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_W = 300, MAX_H = 150;
                let w = img.width, h = img.height;
                if (w > MAX_W) { h = h * (MAX_W / w); w = MAX_W; }
                if (h > MAX_H) { w = w * (MAX_H / h); h = MAX_H; }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/png', 0.9);
                setFormData(prev => ({ ...prev, signatureDataUrl: dataUrl }));
                if (success) setSuccess("");
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    const removeSignature = () => {
        setFormData(prev => ({ ...prev, signatureDataUrl: "" }));
        if (success) setSuccess("");
    };

    // Theme state
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || 'dark';
    });

    // Apply theme on mount and when theme changes
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'light') {
            root.classList.add('light');
        } else {
            root.classList.remove('light');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    useEffect(() => {
        if (!currentUser) return;
        const fetchProfile = async () => {
            try {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().companyProfile) {
                    setFormData(docSnap.data().companyProfile);
                }
            } catch (err) {
                setError("Failed to load profile data.");
            } finally {
                setFetchLoading(false);
            }
        };
        fetchProfile();
    }, [currentUser]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
        if (success) setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            if (!currentUser) throw new Error("No user logged in");

            await updateDoc(doc(db, "users", currentUser.uid), {
                companyProfile: formData,
            });

            setSuccess("Settings saved successfully!");
        } catch (err) {
            setError("Failed to save settings. Please try again.");
        }
        setLoading(false);
    };

    if (fetchLoading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Company Profile</CardTitle>
                    <CardDescription>Manage your business details and preferences.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
                    {success && <Alert className="mb-4 border-green-500 text-green-700 bg-green-50"><CheckCircle2 className="h-4 w-4 mr-2" /><AlertDescription>{success}</AlertDescription></Alert>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name</Label>
                                <Input id="companyName" required value={formData.companyName} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gstin">GSTIN</Label>
                                <Input id="gstin" required value={formData.gstin} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                                <Input id="invoicePrefix" value={formData.invoicePrefix} onChange={handleChange} placeholder="e.g. INV" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" required value={formData.address} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="state">State Name</Label>
                                <Select
                                    value={formData.stateCode}
                                    onValueChange={(code) => {
                                        setFormData({
                                            ...formData,
                                            stateCode: code,
                                            state: getStateNameByCode(code)
                                        });
                                        if (success) setSuccess("");
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(STATE_CODES).map(([code, name]) => (
                                            <SelectItem key={code} value={code}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stateCode">State Code</Label>
                                <Input
                                    id="stateCode"
                                    value={formData.stateCode}
                                    onChange={(e) => {
                                        const code = e.target.value;
                                        const paddedCode = code.padStart(2, '0');
                                        const stateName = getStateNameByCode(paddedCode);
                                        setFormData({
                                            ...formData,
                                            stateCode: code,
                                            state: stateName || formData.state
                                        });
                                        if (success) setSuccess("");
                                    }}
                                    placeholder="e.g. 27"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg pt-4 border-t">Bank Details <span className="text-sm font-normal text-muted-foreground">(Optional)</span></h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="bankName">Bank Name</Label>
                                    <Input id="bankName" value={formData.bankName} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accountNo">Account No</Label>
                                    <Input id="accountNo" value={formData.accountNo} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ifsc">IFSC Code</Label>
                                    <Input id="ifsc" value={formData.ifsc} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="branch">Branch</Label>
                                    <Input id="branch" value={formData.branch} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg pt-4 border-t">Invoice Banner / Logo <span className="text-sm font-normal text-muted-foreground">(Optional)</span></h3>
                            <p className="text-sm text-muted-foreground">Upload a banner or logo image. It will appear at the top of your invoices. Images are auto-resized for best quality.</p>
                            <input
                                ref={bannerInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleBannerUpload}
                            />
                            {formData.bannerDataUrl ? (
                                <div className="space-y-3">
                                    <div className="border rounded-lg p-3 bg-white dark:bg-zinc-900">
                                        <img
                                            src={formData.bannerDataUrl}
                                            alt="Banner Preview"
                                            style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => bannerInputRef.current?.click()}>
                                            <Upload className="h-4 w-4 mr-1" /> Change
                                        </Button>
                                        <Button type="button" variant="destructive" size="sm" onClick={removeBanner}>
                                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button type="button" variant="outline" onClick={() => bannerInputRef.current?.click()}>
                                    <ImageIcon className="h-4 w-4 mr-2" /> Upload Banner / Logo
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg pt-4 border-t">Authorised Signature <span className="text-sm font-normal text-muted-foreground">(Optional)</span></h3>
                            <p className="text-sm text-muted-foreground">Upload your signature image. It will appear on invoices, quotations, and ledgers.</p>
                            <input
                                ref={signatureInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleSignatureUpload}
                            />
                            {formData.signatureDataUrl ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="border rounded-lg p-3 bg-white dark:bg-zinc-900">
                                        <img
                                            src={formData.signatureDataUrl}
                                            alt="Signature Preview"
                                            style={{ maxHeight: '60px', maxWidth: '200px', objectFit: 'contain' }}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => signatureInputRef.current?.click()}>
                                            <Upload className="h-4 w-4 mr-1" /> Change
                                        </Button>
                                        <Button type="button" variant="destructive" size="sm" onClick={removeSignature}>
                                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button type="button" variant="outline" onClick={() => signatureInputRef.current?.click()}>
                                    <Upload className="h-4 w-4 mr-2" /> Upload Signature
                                </Button>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Theme Toggle Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of your application.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Theme</Label>
                            <div className="text-sm text-muted-foreground">
                                Switch between light and dark mode
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleTheme}
                            className="h-10 w-10"
                        >
                            {theme === 'dark' ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
