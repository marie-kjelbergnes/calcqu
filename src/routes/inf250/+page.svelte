<script lang="ts">
    import Quiz from "$lib/mcq/Quiz.svelte";
    import { categories } from "$lib/mcq";
</script>

<Quiz title="INF250" {categories} />
