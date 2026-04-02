import '@/styles/LegalPage.css';
export const metadata = { title: 'Privacy Policy — OJOs' };

export default function Privacy() {
  return (
    <article className="legal">
      <h1 className="legal__title">Privacy Policy</h1>
      <p className="legal__date">Last updated: March 2025</p>

      <div className="legal__section">
        <h2>Overview</h2>
        <p>OJOs ("we", "us", or "our") operates ojos.life. This policy explains what information we collect, how we use it, and your rights around that data. We keep it simple: we collect only what we need and never sell your data.</p>
      </div>
      <div className="legal__section">
        <h2>Information We Collect</h2>
        <p>When you create an account, we collect your email address and any profile information you choose to provide (name, bio, preferences). When you use the platform, we log standard activity data — pages visited, meetings requested — to help us improve the product.</p>
        <p>We use Supabase for authentication and data storage. Supabase may collect device and usage data subject to their privacy policy.</p>
      </div>
      <div className="legal__section">
        <h2>How We Use Your Information</h2>
        <p>We use your data to operate the platform (creating your profile, facilitating meetings), send you transactional emails related to your account, and improve OJOs based on aggregate usage patterns. We do not use your data for advertising or sell it to third parties.</p>
      </div>
      <div className="legal__section">
        <h2>Data Sharing</h2>
        <p>Profile information you make public on OJOs is visible to other users by design — that is the purpose of the platform. Private information (your email, account settings) is never shared with other users. We share data with service providers only to the extent needed to run the product.</p>
      </div>
      <div className="legal__section">
        <h2>Data Retention &amp; Deletion</h2>
        <p>You can delete your account at any time from your account settings. Upon deletion, your profile and personal data are removed from our database within 30 days.</p>
      </div>
      <div className="legal__section">
        <h2>Cookies</h2>
        <p>We use session cookies required for authentication. We do not use third-party tracking cookies or advertising cookies.</p>
      </div>
      <div className="legal__section">
        <h2>Contact</h2>
        <p>Questions about this policy? Email us at <a href="mailto:hello@ojos.life">hello@ojos.life</a>.</p>
      </div>
    </article>
  );
}
