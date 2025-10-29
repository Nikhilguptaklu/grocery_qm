# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b7ab0881-57db-4aa4-99a2-4ce818399dd9

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b7ab0881-57db-4aa4-99a2-4ce818399dd9) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b7ab0881-57db-4aa4-99a2-4ce818399dd9) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Local payment server for Razorpay integration

This project includes a small Express server under `server/` that is used to create Razorpay orders and verify payments.

Steps to run the server locally:

1. Copy `server/.env.example` to `server/.env` and set your Razorpay credentials.
2. Install server dependencies and start the server:

```sh
cd server
npm install
npm run dev
```

3. The server will run on the port set in `server/.env` (default 4000) and expose these endpoints:
- `POST /api/create-order` - body: { amount: number, currency?: 'INR', receipt?: string }
- `POST /api/verify-payment` - body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }

These endpoints are intentionally minimal. They create Razorpay orders (amount in rupees) and verify the payment signature.

Frontend configuration

Add a `.env` file at the project root (you can copy `.env.example`) with these variables:

- `VITE_PAYMENT_SERVER_URL` - URL where the payment server runs (default http://localhost:4000)
- `VITE_RAZORPAY_KEY_ID` - Your Razorpay Key ID (public) to prefill the Checkout. The secret must remain on the server.


