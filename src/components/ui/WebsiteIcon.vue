<template>
  <img :src="iconSrc" :alt="websiteName" class="website-icon" @error="handleIconError" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { getWebsiteIcon, generateLetterIcon } from '@/utils/iconUtils'

const props = defineProps<{
  websiteUrl: string
  websiteName: string
}>()

const iconSrc = ref('')

const loadIcon = async () => {
  iconSrc.value = await getWebsiteIcon(props.websiteUrl, props.websiteName)
}

const handleIconError = () => {
  iconSrc.value = generateLetterIcon(props.websiteName)
}

watch(() => [props.websiteUrl, props.websiteName], loadIcon)

onMounted(loadIcon)
</script>

<style scoped>
.website-icon {
  width: 100%;
  height: 100%;
  border-radius: 0.375rem;
  object-fit: cover;
}
</style>