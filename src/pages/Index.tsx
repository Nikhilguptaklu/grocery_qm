import { Helmet } from 'react-helmet';
// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Helmet>
        <title>HN Mart - Welcome</title>
        <meta name="description" content="Welcome to HN Mart. Start building your amazing grocery shopping experience here!" />
        <meta name="keywords" content="hnmart, grocery, online shopping, welcome, fresh groceries" />
        <meta property="og:title" content="HN Mart - Welcome" />
        <meta property="og:description" content="Welcome to HN Mart. Start building your amazing grocery shopping experience here!" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/public/favicon.ico" />
        <meta property="og:url" content="https://hnmart.com" />
      </Helmet>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
      </div>
    </div>
  );
};

export default Index;
