import { motion } from "framer-motion";
import { ShoppingCart, Shield, Store, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const setRole = useStore((s) => s.setRole);
  const owners = useStore((s) => s.owners);
  const addOwner = useStore((s) => s.addOwner);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup fields
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const enterAsCustomer = () => {
    setRole("customer");
    navigate("/shop");
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = owners.find((o) => o.email === email && o.password === password);
    if (found) {
      setRole("admin");
      navigate("/admin");
      toast.success(`Welcome back, ${found.name}!`);
    } else {
      toast.error("Invalid credentials. Please check your email and password.");
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPhone.trim() || !signupPassword) {
      toast.error("Please fill all fields"); return;
    }
    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters"); return;
    }
    if (signupPassword !== signupConfirm) {
      toast.error("Passwords do not match"); return;
    }
    if (owners.some((o) => o.email === signupEmail.trim())) {
      toast.error("An account with this email already exists"); return;
    }
    addOwner({ name: signupName.trim(), email: signupEmail.trim(), phone: signupPhone.trim(), password: signupPassword });
    toast.success("Account created! You can now login.");
    setShowSignup(false);
    setShowLogin(true);
    setEmail(signupEmail.trim());
    setSignupName(""); setSignupEmail(""); setSignupPhone(""); setSignupPassword(""); setSignupConfirm("");
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <Store className="h-10 w-10 text-primary" style={{ color: "hsl(152, 55%, 45%)" }} />
            <h1 className="text-5xl font-bold font-display" style={{ color: "hsl(0, 0%, 100%)" }}>
              UGMS
            </h1>
          </div>
          <p className="text-lg" style={{ color: "hsl(140, 15%, 70%)" }}>
            Unified Grocery Management System
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={enterAsCustomer}
            className="group cursor-pointer rounded-2xl p-8 border border-border/20 bg-card/10 backdrop-blur-sm hover:bg-card/20 transition-all duration-300"
          >
            <div className="gradient-primary w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-8 w-8" style={{ color: "hsl(0, 0%, 100%)" }} />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2" style={{ color: "hsl(0, 0%, 100%)" }}>
              Customer
            </h2>
            <p style={{ color: "hsl(140, 15%, 65%)" }}>
              Browse products, add to cart, and checkout — no login required.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onClick={() => setShowLogin(true)}
            className="group cursor-pointer rounded-2xl p-8 border border-border/20 bg-card/10 backdrop-blur-sm hover:bg-card/20 transition-all duration-300"
          >
            <div className="gradient-accent w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="h-8 w-8" style={{ color: "hsl(0, 0%, 100%)" }} />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2" style={{ color: "hsl(0, 0%, 100%)" }}>
              Shop Owner
            </h2>
            <p style={{ color: "hsl(140, 15%, 65%)" }}>
              Manage workers, inventory, suppliers, and view reports.
            </p>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-sm"
          style={{ color: "hsl(140, 15%, 50%)" }}
        >
          Demo credentials — Email: admin@ugms.com • Password: admin123
        </motion.p>
      </div>

      {/* Login Dialog */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Shop Owner Login</DialogTitle>
            <DialogDescription>Enter your credentials to access the admin dashboard.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@ugms.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required />
            </div>
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
          <div className="text-center mt-2">
            <Button variant="link" className="text-sm" onClick={() => { setShowLogin(false); setShowSignup(true); }}>
              <UserPlus className="h-4 w-4 mr-1" /> Don't have an account? Sign Up
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create Owner Account</DialogTitle>
            <DialogDescription>Register as a new shop owner.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Your full name" required />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} placeholder="9876543210" required />
            </div>
            <div className="space-y-2">
              <Label>Create Password *</Label>
              <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Min 6 characters" required />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password *</Label>
              <Input type="password" value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} placeholder="Re-enter password" required />
            </div>
            <Button type="submit" className="w-full">Create Account</Button>
          </form>
          <div className="text-center mt-2">
            <Button variant="link" className="text-sm" onClick={() => { setShowSignup(false); setShowLogin(true); }}>
              Already have an account? Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
