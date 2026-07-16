import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchListings from "./tools/search-listings";
import getListing from "./tools/get-listing";
import listMyListings from "./tools/list-my-listings";
import createListing from "./tools/create-listing";
import listBuyRequests from "./tools/list-buy-requests";
import updateBuyRequest from "./tools/update-buy-request";
import myProfile from "./tools/my-profile";

// Use the direct Supabase issuer host. The `.lovable.cloud` runtime URL is a
// proxy and does not match the discovery document's `issuer`, which strict OAuth
// clients (and mcp-js) reject. The project ref is inlined by Vite at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "campuscart-mcp",
  title: "CampusCart",
  version: "0.1.0",
  instructions:
    "Tools for the CampusCart student marketplace. Use `search_listings` and `get_listing` to browse; `list_my_listings` and `create_listing` to manage the signed-in user's items; `list_buy_requests` and `update_buy_request` to manage buy requests; `get_my_profile` for the current user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchListings,
    getListing,
    listMyListings,
    createListing,
    listBuyRequests,
    updateBuyRequest,
    myProfile,
  ],
});
