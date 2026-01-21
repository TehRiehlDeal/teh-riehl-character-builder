<script lang="ts">
	import Modal from '../common/Modal.svelte';
	import VariantRulesSettings from './VariantRulesSettings.svelte';

	interface Props {
		/** Whether the modal is open */
		open?: boolean;
		/** Callback when modal is closed */
		onClose?: () => void;
	}

	let { open = $bindable(false), onClose }: Props = $props();

	function handleClose() {
		open = false;
		onClose?.();
	}
</script>

<Modal bind:open={open} title="Variant Rules Settings" size="lg" onClose={handleClose}>
	<VariantRulesSettings />
</Modal>
