# PageSpeed Insights API key

`<LighthouseViewer url="…" />` analyzes a live website. This page explains the API key that this
mode uses: what it is for, when you need it, how to create one, and how to keep it safe.

The other two modes, `src` (a saved report file) and `report` (a report object), never call
Google and need no key.

## Why the `url` mode needs Google

Lighthouse measures a page by loading it in a real Chrome browser. A web page cannot do that for
another website, so the component asks the
[PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started). Google
runs Lighthouse on its servers and returns the report, and the component renders it.

Because Google's servers load the page, the URL must be public. Pages on `localhost`, an intranet,
or behind a login cannot be analyzed this way. For those, run Lighthouse yourself and use `src`.

## Do I need a key?

Google says the API "can be used with or without an API key, although a key is recommended for
frequent, automated queries."

In practice, requests without a key share one public quota, which is often used up. When that
happens, the component shows:

> PageSpeed Insights quota exceeded. Pass an `apiKey` to use your own quota.

With a key, your requests count against your own Google Cloud project instead. The key is free;
you need a Google Cloud project, and Google shows the project's limits on the
[Quotas page](https://console.cloud.google.com/apis/api/pagespeedonline.googleapis.com/quotas).

## Create a key

1. Open the [Google Cloud console](https://console.cloud.google.com/) and pick or create a
   project.
2. Go to **APIs & Services → Library**, search for **PageSpeed Insights API**, and click
   **Enable**.
3. Go to **APIs & Services → Credentials**, click **Create credentials → API key**, and copy the
   key.
4. Restrict the key right away (next section).

## Restrict the key

The component calls Google from the browser, so anyone who opens your site can see the key in
the network requests and in your JavaScript bundle. You cannot hide a key in a single-page app.

**Is that safe?** It is safe enough for a demo, a docs site or an internal tool, if you restrict
the key as shown below. It is not a secret:

- The PageSpeed Insights API is free, so a leaked key cannot run up a bill. The risk is quota:
  someone who copies the key can use up its daily requests, and then your `url` viewers fail until
  the quota resets.
- The **Websites** restriction stops other sites from using the key in a browser. It does not stop
  a script on a server, which can send any `Referer` header it wants.

For a public production app, keep the key on your server
([Keep the key off the browser](#keep-the-key-off-the-browser)).

On the key's page in **APIs & Services → Credentials**:

1. Under **API restrictions**, choose **Restrict key** and select only **PageSpeed Insights API**.
2. Under **Application restrictions**, choose **Websites** and add each origin that uses the key,
   for example:
   - `https://www.example.com/*`
   - `http://localhost:5173/*` for local development

   The browser sends the page's address with each request, and Google rejects browser requests
   from any other site.

3. Save. Changes can take a few minutes to apply.

Rotate the key (create a new one, deploy it, then delete the old one) if it ends up somewhere it
should not be, such as a public repository without restrictions.

## Pass the key to the component

Keep the key in an environment variable, not in your source code. Build tools put public
variables into the browser bundle. That is acceptable only for a restricted key (see above).

**Vite** (`.env.local`, which Vite does not commit by default):

```sh
VITE_PAGESPEED_API_KEY=your-key
```

```tsx
<LighthouseViewer url="https://www.example.com" apiKey={import.meta.env.VITE_PAGESPEED_API_KEY} />
```

**Next.js** (`.env.local`):

```sh
NEXT_PUBLIC_PAGESPEED_API_KEY=your-key
```

```tsx
<LighthouseViewer
  url="https://www.example.com"
  apiKey={process.env.NEXT_PUBLIC_PAGESPEED_API_KEY}
/>
```

**GitHub Actions** (for a site that you build in CI): store the key as a repository secret and set
the variable in the build step:

```yaml
- run: pnpm build
  env:
    VITE_PAGESPEED_API_KEY: ${{ secrets.PAGESPEED_API_KEY }}
```

## Keep the key off the browser

This is the recommended setup for a public production app. Run Lighthouse on your server: call
the PageSpeed Insights API (or the `lighthouse` Node package) from your backend, store or return
the report JSON, and show it with `src` or `report`. The key stays in a server environment
variable, and your server can limit, cache and authenticate the requests:

```tsx
<LighthouseViewer src={`/api/lighthouse?url=${encodeURIComponent(site)}`} />
```

## Troubleshooting

| Message                                                                                | Cause and fix                                                                                                                                         |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| PageSpeed Insights quota exceeded. Pass an `apiKey`…                                   | The shared public quota is used up. Create a key and pass `apiKey`.                                                                                   |
| Could not reach PageSpeed Insights…                                                    | A network error, or Google refused the request without CORS headers (this happens for some quota errors). Check the connection, and pass an `apiKey`. |
| PageSpeed Insights could not analyze the page: … `FAILED_DOCUMENT_REQUEST`             | Google could not load the page. Check that the URL is public and loads in a browser.                                                                  |
| PageSpeed Insights could not analyze the page: … API key not valid                     | The key is wrong, or it was deleted. Copy it again from the Credentials page.                                                                         |
| PageSpeed Insights could not analyze the page: … referer … blocked                     | The site's origin is not in the key's **Websites** restriction. Add it.                                                                               |
| PageSpeed Insights could not analyze the page: … has not been used … or it is disabled | The PageSpeed Insights API is not enabled in the key's project. Enable it in **APIs & Services → Library**.                                           |

A run takes about 10 to 30 seconds. The component shows its loading state (or your `fallback`)
until the report arrives, and it caches the result for the page's lifetime, so showing the same
URL again does not call Google again.
