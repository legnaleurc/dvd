<script lang="ts">
  import { page } from "$app/stores";
  import { getFullScreenContext } from "$stores/fullscreen";
  import Icon from "$atoms/Icon.svelte";

  type Tab = {
    path: string;
    icon: string;
  };

  const TAB_MAP: Tab[] = [
    {
      path: "/files",
      icon: "folder",
    },
    {
      path: "/search",
      icon: "search",
    },
    {
      path: "/video",
      icon: "video_library",
    },
    {
      path: "/comic",
      icon: "photo_library",
    },
    {
      path: "/settings",
      icon: "settings",
    },
  ];

  const { isFullScreen } = getFullScreenContext();
</script>

<nav class="bg-pale-900" class:hidden={$isFullScreen}>
  <ul class="h-12 w-full flex flex-row">
    {#each TAB_MAP as tab (tab.path)}
      <li class="flex-grow">
        <a
          draggable="false"
          class="w-full h-full flex justify-center items-center active:bg-pale-700"
          class:text-pale-300={!$page.url.pathname.startsWith(tab.path)}
          href={tab.path}
        >
          <Icon name={tab.icon} />
        </a>
      </li>
    {/each}
  </ul>
</nav>
