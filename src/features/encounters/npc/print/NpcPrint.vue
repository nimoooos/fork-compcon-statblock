<template>
  <v-card tile flat light class="printable" style="margin-left: auto; margin-right: auto">
    <h1>NPC Print View (WIP)</h1>
    <h2>NPC ID: {{ this.npc.ID }}</h2>
    <h3>NPC Name: {{this.npc.Name}}</h3>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue'
import NpcCard from '../NpcCard.vue'
import { getModule } from 'vuex-module-decorators'
import { NpcStore } from '@/store'
import { Npc } from '@/class'


export default Vue.extend({
  name: 'combined-print',
  components: {
    NpcCard
  },
  props: {
    npcId: {
      type:String,
      required: true
    }
  },
  data: () => ({
    npc: null,
    blank: false,
  }),
  created() {
    if (this.npcId === 'blank') this.blank = true
    console.log("this.npcId:",this.npcId)
    this.npc = getModule(NpcStore, this.$store).Npcs.find(
      npc => npc.ID === this.npcId
    )
      console.log(this.npc)
  }
})
</script>

<style>
.v-application .caption {
  line-height: normal !important;
}
</style>

<style scoped>
.printable {
  background-color: white !important;
  width: 210mm;
}

@page {
  margin: 0;
  padding: 0;
}

@media print {
  @page {
    max-height: 100%;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0;
    padding: 0;
    color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
    background-color: white;
  }

  .printable {
    /* zoom: 75%; */
    width: 100% !important;
    max-width: 100% !important;

    margin: 0 !important;
    padding: 0 !important;
    color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }
  .caption {
    line-height: normal;
  }
  fieldset {
    padding: 0px;
    border-style: solid;
  }
}
</style>
