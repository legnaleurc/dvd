<script lang="ts">
  import { page } from "$app/stores";

  import type { SvelteComponentConstructor } from "$lib/types/traits";
  import { setComicContext } from "$lib/stores/comic";
  import { setVideoContext } from "$lib/stores/video";
  import FilePage from "./file/FilePage.svelte";
  import SearchPage from "./search/SearchPage.svelte";
  import ComicPage from "./comic/ComicPage.svelte";
  import VideoPage from "./video/VideoPage.svelte";
  import SettingsPage from "./settings/SettingsPage.svelte";

  setComicContext();
  setVideoContext();

  type Page = {
    routePrefix: string;
    content: SvelteComponentConstructor;
  };

  const PAGES: Page[] = [
    {
      routePrefix: "files",
      content: FilePage,
    },
    {
      routePrefix: "search",
      content: SearchPage,
    },
    {
      routePrefix: "video",
      content: VideoPage,
    },
    {
      routePrefix: "comic",
      content: ComicPage,
    },
    {
      routePrefix: "settings",
      content: SettingsPage,
    },
  ];
</script>

<main class="w-full h-full">
  {#each PAGES as page_ (page_.routePrefix)}
    <section
      class="w-full h-full"
      hidden={!$page.routeId.startsWith(page_.routePrefix)}
    >
      <svelte:component this={page_.content}>
        <slot />
      </svelte:component>
    </section>
  {/each}
</main>
