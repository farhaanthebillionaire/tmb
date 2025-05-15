import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link'; 

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* Reduced bottom padding */}
      <main className="flex-grow container mx-auto px-4 py-12 pb-8">
        <h1 className="text-3xl font-bold text-primary mb-6">Terms of Service</h1>
        <div className="prose prose-lg max-w-none text-foreground">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <h2 className="text-xl font-semibold text-primary mt-4">1. Agreement to Terms</h2>
          <p>By accessing or using TrackMyBite (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">2. Changes to Terms or Services</h2>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">3. Accounts</h2>
          <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">4. Privacy Policy</h2>
          <p>Our Privacy Policy describes how we handle the information you provide to us when you use our Services. You understand that through your use of the Services you consent to the collection and use (as set forth in the Privacy Policy) of this information. Please refer to our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for information on how we collect, use and disclose information from our users.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">5. Content and Content Rights</h2>
          <p>For purposes of these Terms: (i) "Content" means text, graphics, images, music, software, audio, video, works of authorship of any kind, and information or other materials that are posted, generated, provided or otherwise made available through the Services; and (ii) "User Content" means any Content that Account holders (including you) provide to be made available through the Services. Content includes without limitation User Content.</p>
          <p>TrackMyBite does not claim any ownership rights in any User Content and nothing in these Terms will be deemed to restrict any rights that you may have to use and exploit your User Content. You are solely responsible for all your User Content. You represent and warrant that you own all your User Content or you have all rights that are necessary to grant us the license rights in your User Content under these Terms.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">6. AI Features and Disclaimer</h2>
          <p>The AI-powered features, including but not limited to plate analysis for calorie and nutritional estimation, and mood-food insights, provide estimates and suggestions for informational purposes only. These features are not a substitute for professional medical, dietary, or nutritional advice. Always consult with a qualified healthcare provider or registered dietitian for any health concerns or before making any decisions related to your health, diet, or treatment. TrackMyBite makes no warranties regarding the accuracy, completeness, or reliability of the AI-generated information.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">7. Prohibited Uses</h2>
          <p>You may use the Service only for lawful purposes and in accordance with Terms. You agree not to use the Service:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>In any way that violates any applicable national or international law or regulation.</li>
            <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.</li>
            <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation.</li>
            <li>To impersonate or attempt to impersonate TrackMyBite, a TrackMyBite employee, another user, or any other person or entity.</li>
          </ul>

          <h2 className="text-xl font-semibold text-primary mt-4">8. Termination</h2>
          <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">9. Disclaimer of Warranties</h2>
          <p>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TRACKMYBITE MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THEIR SERVICES, OR THE INFORMATION, CONTENT OR MATERIALS INCLUDED THEREIN. YOU EXPRESSLY AGREE THAT YOUR USE OF THESE SERVICES, THEIR CONTENT, AND ANY SERVICES OR ITEMS OBTAINED FROM US IS AT YOUR SOLE RISK.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">10. Limitation of Liability</h2>
          <p>EXCEPT AS PROHIBITED BY LAW, YOU WILL HOLD US AND OUR OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS HARMLESS FOR ANY INDIRECT, PUNITIVE, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGE, HOWEVER IT ARISES (INCLUDING ATTORNEYS' FEES AND ALL RELATED COSTS AND EXPENSES OF LITIGATION AND ARBITRATION), WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE, OR OTHER TORTIOUS ACTION, OR ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT.</p>
          
          <h2 className="text-xl font-semibold text-primary mt-4">11. Governing Law</h2>
          <p>These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which TrackMyBite operates, without regard to its conflict of law provisions.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">12. Contact Information</h2>
          <p>If you have any questions about these Terms, please contact us at terms@trackmybite.example.com.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
