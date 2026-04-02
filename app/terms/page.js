import '@/styles/LegalPage.css';
export const metadata = { title: 'Terms of Service — OJOs' };

export default function Terms() {
  return (
    <article className="legal">
      <h1 className="legal__title">Terms of Service</h1>
      <p className="legal__date">Last updated: March 2025</p>
      <div className="legal__section"><h2>Acceptance</h2><p>By creating an account or using OJOs, you agree to these Terms. If you do not agree, please do not use the platform. We may update these Terms from time to time; continued use after changes means you accept the updated Terms.</p></div>
      <div className="legal__section"><h2>What OJOs Is</h2><p>OJOs is a platform for creating public profiles that communicate what you are open to, what you are looking for, and how others can connect with you. It facilitates meeting requests between users.</p></div>
      <div className="legal__section"><h2>Your Account</h2><p>You are responsible for keeping your account credentials secure and for all activity under your account. You must be at least 18 years old to create an account. You may only create one account; duplicate accounts may be removed.</p></div>
      <div className="legal__section"><h2>Acceptable Use</h2><p>You agree not to use OJOs to harass, spam, or deceive other users; post content that is illegal, hateful, or violates others' rights; attempt to scrape, reverse-engineer, or disrupt the platform; or impersonate another person or organization.</p><p>We reserve the right to suspend or terminate accounts that violate these rules.</p></div>
      <div className="legal__section"><h2>Your Content</h2><p>You own the content you post on OJOs. By posting it, you grant us a non-exclusive, royalty-free license to display it on the platform. You are responsible for ensuring your content does not infringe on any third-party rights.</p></div>
      <div className="legal__section"><h2>Limitation of Liability</h2><p>OJOs is provided "as is." We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability to you for any claim shall not exceed the amount you have paid us in the past 12 months.</p></div>
      <div className="legal__section"><h2>Termination</h2><p>You may delete your account at any time. We may suspend or terminate your access if you violate these Terms or if we discontinue the service, with reasonable notice where possible.</p></div>
      <div className="legal__section"><h2>Contact</h2><p>Questions about these Terms? Reach us at <a href="mailto:hello@ojos.life">hello@ojos.life</a>.</p></div>
    </article>
  );
}
