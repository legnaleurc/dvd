<script lang="ts" context="module">
  const MAP: Record<string, string> = {
    folder: "folder",
    video: "video_file",
    audio: "audio_file",
    image: "image",
  };

  function getIconName(category: string) {
    const name = MAP[category];
    if (!name) {
      return "description";
    }
    return name;
  }
</script>

<script lang="ts">
  import Icon from "./Icon.svelte";

  export let category: string;
</script>

<Icon name={getIconName(category)} />
