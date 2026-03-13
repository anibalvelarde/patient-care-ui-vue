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
          to="/"
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

        <!-- Option 04 -->
        <router-link
          to="/option-04"
          class="group block bg-white rounded-xl border-2 border-indigo-200 hover:border-indigo-400 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
        >
          <div class="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 py-10 text-center">
            <span class="text-4xl">📋</span>
          </div>
          <div class="p-6">
            <h2 class="text-lg font-semibold text-gray-800 group-hover:text-indigo-700">Option 04: Kanban Board</h2>
            <p class="text-sm text-gray-500 mt-2">
              Status-first swim lanes (Upcoming, Completed, Past Due). Card-based, like a Trello board for appointments.
            </p>
            <span class="inline-block mt-4 text-sm font-medium text-indigo-400 group-hover:text-indigo-600">
              View &rarr;
            </span>
          </div>
        </router-link>

        <!-- Option 05 -->
        <router-link
          to="/option-05"
          class="group block bg-white rounded-xl border-2 border-rose-200 hover:border-rose-400 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
        >
          <div class="bg-gradient-to-br from-rose-500 to-orange-500 px-6 py-10 text-center">
            <span class="text-4xl">🖥️</span>
          </div>
          <div class="p-6">
            <h2 class="text-lg font-semibold text-gray-800 group-hover:text-rose-700">Option 05: Command Center</h2>
            <p class="text-sm text-gray-500 mt-2">
              Everything visible at once. Calendar, AM table, PM table side-by-side. Alert strip at bottom. No scrolling.
            </p>
            <span class="inline-block mt-4 text-sm font-medium text-rose-400 group-hover:text-rose-600">
              View &rarr;
            </span>
          </div>
        </router-link>
        <!-- Option 06 -->
        <router-link
          to="/option-06"
          class="group block bg-white rounded-xl border-2 border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
        >
          <div class="bg-gradient-to-br from-slate-600 to-blue-600 px-6 py-10 text-center">
            <span class="text-4xl">📧</span>
          </div>
          <div class="p-6">
            <h2 class="text-lg font-semibold text-gray-800 group-hover:text-blue-700">Option 06: Split Panel</h2>
            <p class="text-sm text-gray-500 mt-2">
              Outlook-style master-detail layout. Compact list on the left, full details on the right. Collapsible calendar.
            </p>
            <span class="inline-block mt-4 text-sm font-medium text-slate-400 group-hover:text-blue-600">
              View &rarr;
            </span>
          </div>
        </router-link>

        <!-- Option 07 -->
        <router-link
          to="/option-07"
          class="group block bg-white rounded-xl border-2 border-amber-200 hover:border-amber-400 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
        >
          <div class="bg-gradient-to-br from-amber-400 to-orange-500 px-6 py-10 text-center">
            <span class="text-4xl">🌿</span>
          </div>
          <div class="p-6">
            <h2 class="text-lg font-semibold text-gray-800 group-hover:text-amber-700">Option 07: Warm Minimal</h2>
            <p class="text-sm text-gray-500 mt-2">
              Calm cream/sand palette with large cards. Pill-style weekday selector. No tables &mdash; everything at a glance.
            </p>
            <span class="inline-block mt-4 text-sm font-medium text-amber-400 group-hover:text-amber-600">
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
