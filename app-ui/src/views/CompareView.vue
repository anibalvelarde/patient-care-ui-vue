<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <header class="bg-white border-b border-gray-200 px-8 py-6">
      <h1 class="text-3xl font-bold text-gray-800">Neurocorp Therapy Center</h1>
      <p class="text-gray-500 mt-1">UI Design Options &mdash; Compare and choose</p>
    </header>

    <main class="max-w-5xl mx-auto px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Current UI -->
        <router-link
          to="/current"
          class="group block bg-white rounded-xl border-2 border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
        >
          <div class="bg-gray-800 px-6 py-10 text-center">
            <span class="text-4xl">📋</span>
          </div>
          <div class="p-6">
            <h2 class="text-lg font-semibold text-gray-800 group-hover:text-gray-900">Current UI</h2>
            <p class="text-sm text-gray-500 mt-2">
              The original layout with sidebar navigation, monospace font, and pink/coral color scheme.
            </p>
            <span class="inline-block mt-4 text-sm font-medium text-gray-400 group-hover:text-gray-600">
              View &rarr;
            </span>
          </div>
        </router-link>

        <!-- Option 01 -->
        <router-link
          to="/option-01"
          class="group block bg-white rounded-xl border-2 border-blue-200 hover:border-blue-400 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
        >
          <div class="bg-gradient-to-br from-blue-600 to-teal-500 px-6 py-10 text-center">
            <span class="text-4xl">🏥</span>
          </div>
          <div class="p-6">
            <h2 class="text-lg font-semibold text-gray-800 group-hover:text-blue-700">Option 01: Clean Medical</h2>
            <p class="text-sm text-gray-500 mt-2">
              Professional blue/teal palette, top navigation, card-based dashboard with modern spacing.
            </p>
            <span class="inline-block mt-4 text-sm font-medium text-blue-400 group-hover:text-blue-600">
              View &rarr;
            </span>
          </div>
        </router-link>

        <!-- Option 02 -->
        <router-link
          to="/option-02"
          class="group block bg-white rounded-xl border-2 border-violet-200 hover:border-violet-400 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
        >
          <div class="bg-gradient-to-br from-violet-700 to-indigo-500 px-6 py-10 text-center">
            <span class="text-4xl">📊</span>
          </div>
          <div class="p-6">
            <h2 class="text-lg font-semibold text-gray-800 group-hover:text-violet-700">Option 02: Dashboard Cards</h2>
            <p class="text-sm text-gray-500 mt-2">
              Modernized sidebar, stats overview, widget-based calendar and appointment panels.
            </p>
            <span class="inline-block mt-4 text-sm font-medium text-violet-400 group-hover:text-violet-600">
              View &rarr;
            </span>
          </div>
        </router-link>
        <!-- Option 03 -->
        <router-link
          to="/option-03"
          class="group block bg-white rounded-xl border-2 border-slate-300 hover:border-cyan-400 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
        >
          <div class="bg-gradient-to-br from-slate-900 to-slate-700 px-6 py-10 text-center">
            <span class="text-4xl">🌙</span>
          </div>
          <div class="p-6">
            <h2 class="text-lg font-semibold text-gray-800 group-hover:text-cyan-600">Option 03: Modern Dark</h2>
            <p class="text-sm text-gray-500 mt-2">
              Dark mode with cyan/emerald accents, data-dense table layout, top navigation bar.
            </p>
            <span class="inline-block mt-4 text-sm font-medium text-slate-400 group-hover:text-cyan-600">
              View &rarr;
            </span>
          </div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CompareView',
});
</script>
