<template>
  <v-menu v-model="menu" offset-y :close-on-content-click="false">
    <template v-slot:activator="{ on }">
      <v-btn outlined x-small class="fadeSelect ml-2" v-on="on">
        <v-icon small>mdi-circle-edit-outline</v-icon>
      </v-btn>
    </template>
    <v-card outlined>
      <v-card-text>
        <v-combobox
          v-model="sel"
          autofocus
          background-color="stark-panel"
          dense
          outlined
          hide-details
          :items="items"
          item-value="value"
        />
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch, Mixins } from 'vue-property-decorator'
import GetColorMixin from '@/mixins/getColor'

@Component({ name: 'cc-combo-select', })
export default class CCComboSelect extends Mixins(GetColorMixin) {

  @Prop({ type: Array, required: true, })
  readonly items!: { 
    text: string | number | object,
    value: string | number | object,
  }[]
  
  sel: string | number | {value: any} = ''
  menu = false
  
  @Watch('sel')
  onSelChange() {
    const s = typeof this.sel === 'object' ? this.sel.value : this.sel
    this.$emit('set', s)
  }
}
</script>
