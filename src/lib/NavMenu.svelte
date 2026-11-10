<script lang="ts">
    import { page } from "$app/state";

    const links = [
        { href: "./", path: "/", name: "Calculator" },
        { href: "./math123", path: "/math123", name: "MATH123" },
        { href: "./inf250", path: "inf250", name: "INF250" },
        { href: "./licenses", path: "/licenses", name: "Licenses & Acknowledgments" },
        { href: "./privacy", path: "/privacy", name: "Privacy Policy" }
    ];

    let open = $state(false);
    let menu: HTMLElement | undefined = $state();

    function handle_click(event: MouseEvent) {
        // close when clicking anywhere outside the menu
        if (open && menu && !menu.contains(event.target as Node)) open = false;
    }

    function handle_keydown(event: KeyboardEvent) {
        if (open && event.key === "Escape") open = false;
    }
</script>

<svelte:window onclick={handle_click} onkeydown={handle_keydown} />

<nav class="menu" bind:this={menu}>
    <button
        class="burger"
        class:open
        onclick={() => (open = !open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="nav-links"
    >
        <span></span>
        <span></span>
        <span></span>
    </button>

    {#if open}
        <ul id="nav-links">
            {#each links as link (link.path)}
                <li>
                    <a
                        href={link.href}
                        class:current={page.url.pathname === link.path}
                        aria-current={page.url.pathname === link.path ? "page" : undefined}
                        onclick={() => (open = false)}
                    >{link.name}</a>
                </li>
            {/each}
        </ul>
    {/if}
</nav>

<style>
    .menu {
        position: absolute;
        top: 50%;
        right: 1.25rem;
        transform: translateY(-50%);
        z-index: 20;
    }

    .burger {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 5px;
        width: 2.5rem;
        height: 2.5rem;
        padding: 0 0.55rem;
        background: none;
        border: 1px solid transparent;
        border-radius: 0.4rem;
        cursor: pointer;
    }

    .burger:hover,
    .burger.open {
        border-color: var(--highlight-high);
    }

    .burger span {
        display: block;
        height: 2px;
        border-radius: 1px;
        background-color: var(--rose);
        transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .burger.open span:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
    }

    .burger.open span:nth-child(2) {
        opacity: 0;
    }

    .burger.open span:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
    }

    ul {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        min-width: 14rem;
        margin: 0;
        padding: 0.4rem 0;
        list-style: none;
        background-color: var(--overlay);
        border: 1px solid var(--highlight-high);
        border-radius: 0.5rem;
        box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.25);
    }

    a {
        display: block;
        padding: 0.55rem 1rem;
        color: var(--text);
        text-decoration: none;
        transition: color 0.2s ease, background-color 0.2s ease;
    }

    a:hover {
        color: var(--love);
        background-color: var(--highlight-low);
    }

    a.current {
        color: var(--rose);
    }
</style>
