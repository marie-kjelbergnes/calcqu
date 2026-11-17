<script lang="ts">
    import Quiz from "$lib/mcq/Quiz.svelte";
    import { categories } from "$lib/dat200";
</script>

<Quiz title="DAT200" {categories} />
