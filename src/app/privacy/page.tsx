import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* Reduced bottom padding */}
      <main className="flex-grow container mx-auto px-4 py-12 pb-8">
        <h1 className="text-3xl font-bold text-primary mb-6">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none text-foreground">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold text-primary mt-4">Introduction</h2>
          <p>Welcome to TrackMyBite. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">Information We Collect</h2>
          <p>We may collect personal information that you voluntarily provide to us when you register on the TrackMyBite, express an interest in obtaining information about us or our products and services, when you participate in activities on the TrackMyBite or otherwise when you contact us.</p>
          <p>The personal information that we collect depends on the context of your interactions with us and the TrackMyBite, the choices you make and the products and features you use. The personal information we collect may include the following: names; email addresses; passwords; contact preferences; contact or authentication data; and other similar information.</p>
          <p>Food and mood logs you create are stored to provide you with the service. Images uploaded for analysis are processed by our AI models and are not stored persistently after analysis as per our design. Any temporary processing data is handled securely and deleted promptly.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">How We Use Your Information</h2>
          <p>We use personal information collected via our TrackMyBite for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>To facilitate account creation and logon process.</li>
            <li>To send administrative information to you.</li>
            <li>To manage user accounts.</li>
            <li>To provide and improve our services, including AI-powered features.</li>
            <li>To respond to user inquiries and offer support.</li>
          </ul>

          <h2 className="text-xl font-semibold text-primary mt-4">Will Your Information Be Shared With Anyone?</h2>
          <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We do not sell your personal information to third parties.</p>
          
          <h2 className="text-xl font-semibold text-primary mt-4">How Long Do We Keep Your Information?</h2>
          <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting or other legal requirements). When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize it.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">How Do We Keep Your Information Safe?</h2>
          <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security, and improperly collect, access, steal, or modify your information.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">Your Privacy Rights</h2>
          <p>Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. Please contact us to exercise these rights.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">Updates to This Notice</h2>
          <p>We may update this privacy notice from time to time. The updated version will be indicated by an updated "Last updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information.</p>

          <h2 className="text-xl font-semibold text-primary mt-4">Contact Us</h2>
          <p>If you have questions or comments about this notice, you may email us at privacy@trackmybite.example.com</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
