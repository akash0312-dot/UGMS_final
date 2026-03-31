import { motion } from "framer-motion";
import { ShoppingCart, Shield, Store, UserPlus, ShoppingBasket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { loginInApi, signupInApi, workerLoginInApi, customerLoginInApi, customerSignupInApi } from "@/lib/api";

const Index = () => {
  const navigate = useNavigate();
  const setRole = useStore((s) => s.setRole);
  const setAuthToken = useStore((s) => s.setAuthToken);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showHrLogin, setShowHrLogin] = useState(false);
  const [hrWorkerCode, setHrWorkerCode] = useState("");
  const [hrPassword, setHrPassword] = useState("");

  const [showWorkerLogin, setShowWorkerLogin] = useState(false);
  const [workerCode, setWorkerCode] = useState("");
  const [workerPassword, setWorkerPassword] = useState("");

  // Signup fields
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const [showCustomerLogin, setShowCustomerLogin] = useState(false);
  const [showCustomerSignup, setShowCustomerSignup] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [customerSignupName, setCustomerSignupName] = useState("");
  const [customerSignupEmail, setCustomerSignupEmail] = useState("");
  const [customerSignupPhone, setCustomerSignupPhone] = useState("");
  const [customerSignupPassword, setCustomerSignupPassword] = useState("");
  const [customerSignupConfirm, setCustomerSignupConfirm] = useState("");

  const enterAsCustomer = () => {
    setShowCustomerLogin(true);
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await customerLoginInApi(customerEmail.trim(), customerPassword);
      setAuthToken(res.access_token);
      const payload = JSON.parse(atob(res.access_token.split('.')[1]));
      useStore.getState().setUserName(payload?.name || null);
      setRole("customer");
      navigate("/shop");
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials.");
    }
  };

  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerSignupName.trim() || !customerSignupEmail.trim() || !customerSignupPassword) {
      toast.error("Please fill all required fields"); return;
    }
    if (customerSignupPassword.length < 6) {
      toast.error("Password must be at least 6 characters"); return;
    }
    if (customerSignupPassword !== customerSignupConfirm) {
      toast.error("Passwords do not match"); return;
    }
    try {
      const res = await customerSignupInApi({
        name: customerSignupName.trim(),
        email: customerSignupEmail.trim(),
        phone: customerSignupPhone.trim(),
        password: customerSignupPassword,
      });
      setAuthToken(res.access_token);
      const payload = JSON.parse(atob(res.access_token.split('.')[1]));
      useStore.getState().setUserName(payload?.name || null);
      setRole("customer");
      toast.success("Account created successfully!");
      setShowCustomerSignup(false);
      navigate("/shop");
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginInApi(email.trim(), password);
      setAuthToken(res.access_token);
      setRole("admin");
      navigate("/admin");
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please check your email and password.");
    }
  };

  const handleHrLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await workerLoginInApi(hrWorkerCode.trim(), hrPassword);
      setAuthToken(res.access_token);

      const payload = JSON.parse(atob(res.access_token.split('.')[1]));
      const catName = payload?.category_name;

      if (catName && catName.toUpperCase() === "HR") {
        setRole("hr");
        navigate("/hr");
        toast.success("Welcome, Manager!");
      } else {
        toast.error("Access denied. You do not have HR or Manager privileges.");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid Staff ID or Password");
    }
  };

  const handleWorkerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await workerLoginInApi(workerCode.trim(), workerPassword);
      setAuthToken(res.access_token);

      const payload = JSON.parse(atob(res.access_token.split('.')[1]));
      const catName = payload?.category_name;

      if (catName && catName.toUpperCase() === "HR") {
        toast.error("HR Managers should use the HR Portal.");
      } else {
        setRole("worker");
        navigate("/worker");
        toast.success("Welcome to the Employee Portal!");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid Staff ID or Password");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
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
    try {
      const res = await signupInApi({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
      });
      setAuthToken(res.access_token);
      setRole("admin");
      toast.success("Account created!");
      setShowSignup(false);
      navigate("/admin");
      setSignupName(""); setSignupEmail(""); setSignupPhone(""); setSignupPassword(""); setSignupConfirm("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    }
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
            <ShoppingBasket className="h-10 w-10 text-primary" style={{ color: "hsl(152, 55%, 45%)" }} />
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

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={() => setShowHrLogin(true)}
            className="group cursor-pointer rounded-2xl p-8 border border-border/20 bg-card/10 backdrop-blur-sm hover:bg-card/20 transition-all duration-300"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2 text-center text-white">
              HR / Manager Portal
            </h2>
            <p className="text-center text-gray-300">
              Manage attendance, leaves, and staff salaries.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            onClick={() => setShowWorkerLogin(true)}
            className="group cursor-pointer rounded-2xl p-8 border border-border/20 bg-card/10 backdrop-blur-sm hover:bg-card/20 transition-all duration-300"
          >
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2 text-center text-white">
              Employee Portal
            </h2>
            <p className="text-center text-gray-300">
              Access your dashboard securely, track shifts, and request leaves.
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

      {/* HR Login Dialog */}
      <Dialog open={showHrLogin} onOpenChange={setShowHrLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Manager / HR Login</DialogTitle>
            <DialogDescription>Enter your assigned ID and password to manage workers.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleHrLogin} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="hrCode">Manager ID</Label>
              <Input id="hrCode" type="text" value={hrWorkerCode} onChange={(e) => setHrWorkerCode(e.target.value)} placeholder="HR001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hrPass">Password</Label>
              <Input id="hrPass" type="password" value={hrPassword} onChange={(e) => setHrPassword(e.target.value)} placeholder="••••••" required />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Access Portal</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Employee Login Dialog */}
      <Dialog open={showWorkerLogin} onOpenChange={setShowWorkerLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Employee Login</DialogTitle>
            <DialogDescription>Enter your assigned Staff ID and password.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWorkerLogin} className="space-y-4 mt-2">
            <div className="space-y-2">
               <Label htmlFor="workerCode">Staff ID</Label>
              <Input id="workerCode" type="text" value={workerCode} onChange={(e) => setWorkerCode(e.target.value)} placeholder="W001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workerPass">Password</Label>
              <Input id="workerPass" type="password" value={workerPassword} onChange={(e) => setWorkerPassword(e.target.value)} placeholder="••••••" required />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Access Dashboard</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Login Dialog */}
      <Dialog open={showCustomerLogin} onOpenChange={setShowCustomerLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Customer Login</DialogTitle>
            <DialogDescription>Login to shop and manage your orders.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCustomerLogin} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="cust-email">Email</Label>
              <Input id="cust-email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="customer@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-password">Password</Label>
              <Input id="cust-password" type="password" value={customerPassword} onChange={(e) => setCustomerPassword(e.target.value)} placeholder="••••••" required />
            </div>
            <Button type="submit" className="w-full text-white bg-green-600 hover:bg-green-700">Sign In</Button>
          </form>
          <div className="text-center mt-2">
            <Button variant="link" className="text-sm" onClick={() => { setShowCustomerLogin(false); setShowCustomerSignup(true); }}>
              <UserPlus className="h-4 w-4 mr-1" /> New customer? Sign Up
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Signup Dialog */}
      <Dialog open={showCustomerSignup} onOpenChange={setShowCustomerSignup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create Customer Account</DialogTitle>
            <DialogDescription>Register to start shopping.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCustomerSignup} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={customerSignupName} onChange={(e) => setCustomerSignupName(e.target.value)} placeholder="Your full name" required />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={customerSignupEmail} onChange={(e) => setCustomerSignupEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={customerSignupPhone} onChange={(e) => setCustomerSignupPhone(e.target.value)} placeholder="9876543210" />
            </div>
            <div className="space-y-2">
              <Label>Create Password *</Label>
              <Input type="password" value={customerSignupPassword} onChange={(e) => setCustomerSignupPassword(e.target.value)} placeholder="Min 6 characters" required />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password *</Label>
              <Input type="password" value={customerSignupConfirm} onChange={(e) => setCustomerSignupConfirm(e.target.value)} placeholder="Re-enter password" required />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Create Account</Button>
          </form>
          <div className="text-center mt-2">
            <Button variant="link" className="text-sm" onClick={() => { setShowCustomerSignup(false); setShowCustomerLogin(true); }}>
              Already have an account? Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
