<?php
use yii\helpers\Html;
/* <kakao-button label="in php"></kakao-button> */
?>
<div class="actions">
  <kakao-button label="<?= Html::encode($label) ?>" variant="ghost"></kakao-button>
  <kakao-select <?= $attrs ?>></kakao-select>
  <kakao-chip tone="<?= $tone ?>" title='x > y'>Chip</kakao-chip>
</div>
