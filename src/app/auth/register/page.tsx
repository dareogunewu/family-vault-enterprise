'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, Loader, UserPlus, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { cryptoService } from '@/lib/services/crypto.service';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      // Calculate password strength
      let strength = 0;
      if (value.length >= 8) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[a-z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^A-Za-z0-9]/.test(value)) strength++;
      setPasswordStrength(strength);
    }
  };

  const validatePassword = () => {
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    if (passwordStrength < 3) {
      return 'Password is too weak. Use a mix of uppercase, lowercase, numbers, and symbols.';
    }
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password
    const passwordError = validatePassword();
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      // Generate cryptographic keys
      const salt = cryptoService.generateSalt();
      const masterKey = await cryptoService.makeKey(formData.password, salt);
      const masterKeyHash = await cryptoService.hashPassword(formData.password, masterKey);
      const userKey = await cryptoService.generateCipherKey();
      const encryptedUserKey = await cryptoService.encryptCipherKey(userKey, masterKey);

      // Create user account
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // For now, store the encrypted keys in localStorage
        // In production, these would be stored after email verification
        localStorage.setItem('temp_master_key_hash', masterKeyHash);
        localStorage.setItem('temp_encrypted_user_key', JSON.stringify({
          data: encryptedUserKey.data,
          iv: encryptedUserKey.iv,
        }));
        
        // Redirect to a success page or show success message
        setError('');
        router.push('/auth/login?message=Registration successful! Please check your email to verify your account.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Family Vault</h1>
          <p className="text-gray-600 mt-2">Create your secure account</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Create Account</CardTitle>
            <CardDescription>
              Set up your family's secure vault with zero-knowledge encryption
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Master Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong master password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${
                            level <= passwordStrength
                              ? getStrengthColor(passwordStrength)
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${
                      passwordStrength <= 2 ? 'text-red-600' :
                      passwordStrength <= 3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      Password strength: {getStrengthText(passwordStrength)}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Master Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your master password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-600">Passwords do not match</p>
                )}
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> Your master password cannot be recovered. 
                  Store it safely - we use zero-knowledge encryption.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || passwordStrength < 3}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Secure Account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>🔒 Zero-knowledge encryption • 🛡️ Enterprise security</p>
          <p>🔐 AES-256 encryption • 🔑 PBKDF2 key derivation</p>
        </div>
      </div>
    </div>
  );
}