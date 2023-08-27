<script lang="ts">
  import { page } from "$app/stores";

  import type { NeverRecord, SvelteComponentModule } from "$types/traits";
  import { setComicContext } from "$stores/comic";
  import { setVideoContext } from "$stores/video";
  import LazyLoad from "$atoms/LazyLoad.svelte";
  import LoadingBlock from "$atoms/LoadingBlock.svelte";

  type $$Slots = {
    default: NeverRecord;
  };

  setComicContext();
  setVideoContext();

  type Page = {
    routePrefix: string;
    lazy: () => Promise<SvelteComponentModule>;
  };

  const PAGES: Page[] = [
    {
      routePrefix: "/files",
      lazy: () => import("./file/FilePage.svelte"),
    },
    {
      routePrefix: "/search",
      lazy: () => import("./search/SearchPage.svelte"),
    },
    {
      routePrefix: "/video",
      lazy: () => import("./video/VideoPage.svelte"),
    },
    {
      routePrefix: "/comic",
      lazy: () => import("./comic/ComicPage.svelte"),
    },
    {
      routePrefix: "/settings",
      lazy: () => import("./settings/SettingsPage.svelte"),
    },
  ];

  $: routeId = $page.route.id ?? "";
</script>

<main class="w-full h-full">
  {#each PAGES as page_ (page_.routePrefix)}
    <section
      class="w-full h-full"
      hidden={!routeId.startsWith(page_.routePrefix)}
    >
      <LazyLoad lazy={page_.lazy}>
        <LoadingBlock slot="pending" />
        <slot slot="fullfilled" />
      </LazyLoad>
    </section>
  {/each}
</main>
