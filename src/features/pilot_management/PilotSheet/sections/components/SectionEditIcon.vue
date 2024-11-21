<template>
  <span>
    <cc-tooltip inline simple :content="label">
      <v-chip
        outlined
        small
        label
        color="grey lighten-3"
        class="fadeSelect ml-8 mr-2 mb-1"
        @click="$emit('open-selector')"
      >
        <v-icon>mdi-circle-edit-outline</v-icon>
      </v-chip>
    </cc-tooltip>
  </span>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'section-edit-chip',
  props: {
    label: {
      type: String,
      required: true,
    },
  },
})
</script>