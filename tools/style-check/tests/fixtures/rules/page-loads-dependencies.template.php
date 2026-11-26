<?php /* A Yii2 layout: the head registers assets in code, so findings are warnings. */ ?>
<!DOCTYPE html>
<html lang="en">
<head>
<?php $this->head() ?>
<script src="<?= $base ?>/components/toast/toast.js" defer></script>
</head>
<body>
<kakao-toast></kakao-toast>
</body>
</html>
