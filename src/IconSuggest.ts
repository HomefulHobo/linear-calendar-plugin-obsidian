import { getIcon, setIcon } from 'obsidian';

interface IconItem {
    value: string;           // The actual emoji or icon name
    type: 'emoji' | 'lucide';
    keywords: string[];      // Search keywords
    category?: string;       // For organizing
}

/**
 * Enhanced icon suggester that shows both emojis and Lucide icons
 * Users can type keywords like "heart" and see both ❤️ and lucide icons
 */
export class IconSuggest {
    inputEl: HTMLInputElement;
    previewEl: HTMLElement | null = null;
    suggestions: HTMLElement | null = null;
    allIcons: IconItem[] = [];

    constructor(inputEl: HTMLInputElement, previewEl?: HTMLElement) {
        this.inputEl = inputEl;
        this.previewEl = previewEl || null;
        this.allIcons = this.buildIconLibrary();

        this.inputEl.addEventListener('input', () => {
            this.updateSuggestions();
            this.updatePreview();
        });
        this.inputEl.addEventListener('focus', () => this.updateSuggestions());
        this.inputEl.addEventListener('blur', () => {
            setTimeout(() => this.closeSuggestions(), 200);
        });

        // Initial preview
        if (this.previewEl && this.inputEl.value) {
            this.updatePreview();
        }
    }

    /**
     * Build comprehensive library of emojis and Lucide icons
     */
    buildIconLibrary(): IconItem[] {
        const items: IconItem[] = [];

        // Add popular emojis with keywords
        const emojis: Array<{ emoji: string; keywords: string[]; category: string }> = [
            // Smileys & Emotion
            { emoji: '😀', keywords: ['smile', 'happy', 'grin', 'face'], category: 'smileys' },
            { emoji: '😃', keywords: ['smile', 'happy', 'joy', 'face'], category: 'smileys' },
            { emoji: '😄', keywords: ['smile', 'happy', 'laugh', 'face'], category: 'smileys' },
            { emoji: '😁', keywords: ['grin', 'smile', 'happy', 'face'], category: 'smileys' },
            { emoji: '😊', keywords: ['smile', 'blush', 'happy', 'face'], category: 'smileys' },
            { emoji: '🙂', keywords: ['smile', 'happy', 'face'], category: 'smileys' },
            { emoji: '😉', keywords: ['wink', 'flirt', 'face'], category: 'smileys' },
            { emoji: '😍', keywords: ['love', 'heart', 'eyes', 'face'], category: 'smileys' },
            { emoji: '🥰', keywords: ['love', 'hearts', 'smile', 'face'], category: 'smileys' },
            { emoji: '😘', keywords: ['kiss', 'love', 'face'], category: 'smileys' },
            { emoji: '😗', keywords: ['kiss', 'face'], category: 'smileys' },
            { emoji: '😙', keywords: ['kiss', 'smile', 'face'], category: 'smileys' },
            { emoji: '😚', keywords: ['kiss', 'closed', 'eyes', 'face'], category: 'smileys' },
            { emoji: '☺️', keywords: ['smile', 'happy', 'face'], category: 'smileys' },
            { emoji: '🤗', keywords: ['hug', 'smile', 'face'], category: 'smileys' },
            { emoji: '🤩', keywords: ['star', 'eyes', 'excited', 'face'], category: 'smileys' },
            { emoji: '🤔', keywords: ['think', 'hmm', 'face'], category: 'smileys' },
            { emoji: '😐', keywords: ['neutral', 'meh', 'face'], category: 'smileys' },
            { emoji: '😑', keywords: ['expressionless', 'meh', 'face'], category: 'smileys' },
            { emoji: '😶', keywords: ['silence', 'quiet', 'face'], category: 'smileys' },
            { emoji: '😏', keywords: ['smirk', 'smug', 'face'], category: 'smileys' },
            { emoji: '😒', keywords: ['unamused', 'meh', 'face'], category: 'smileys' },
            { emoji: '🙄', keywords: ['eye', 'roll', 'annoyed', 'face'], category: 'smileys' },
            { emoji: '😬', keywords: ['grimace', 'awkward', 'face'], category: 'smileys' },
            { emoji: '😔', keywords: ['sad', 'pensive', 'face'], category: 'smileys' },
            { emoji: '😪', keywords: ['sleepy', 'tired', 'face'], category: 'smileys' },
            { emoji: '🤤', keywords: ['drool', 'sleep', 'face'], category: 'smileys' },
            { emoji: '😴', keywords: ['sleep', 'zzz', 'face'], category: 'smileys' },
            { emoji: '😷', keywords: ['mask', 'sick', 'face'], category: 'smileys' },
            { emoji: '🤒', keywords: ['sick', 'thermometer', 'face'], category: 'smileys' },
            { emoji: '🤕', keywords: ['hurt', 'bandage', 'face'], category: 'smileys' },
            { emoji: '🤢', keywords: ['nausea', 'sick', 'face'], category: 'smileys' },
            { emoji: '🤮', keywords: ['vomit', 'sick', 'face'], category: 'smileys' },
            { emoji: '🤧', keywords: ['sneeze', 'sick', 'face'], category: 'smileys' },
            { emoji: '🥵', keywords: ['hot', 'heat', 'face'], category: 'smileys' },
            { emoji: '🥶', keywords: ['cold', 'freeze', 'face'], category: 'smileys' },
            { emoji: '😎', keywords: ['cool', 'sunglasses', 'face'], category: 'smileys' },
            { emoji: '🤓', keywords: ['nerd', 'geek', 'glasses', 'face'], category: 'smileys' },
            { emoji: '🧐', keywords: ['monocle', 'inspect', 'face'], category: 'smileys' },
            { emoji: '😕', keywords: ['confused', 'unsure', 'face'], category: 'smileys' },
            { emoji: '😟', keywords: ['worried', 'sad', 'face'], category: 'smileys' },
            { emoji: '🙁', keywords: ['frown', 'sad', 'face'], category: 'smileys' },
            { emoji: '☹️', keywords: ['frown', 'sad', 'face'], category: 'smileys' },
            { emoji: '😮', keywords: ['wow', 'surprised', 'face'], category: 'smileys' },
            { emoji: '😯', keywords: ['hushed', 'surprised', 'face'], category: 'smileys' },
            { emoji: '😲', keywords: ['shocked', 'surprised', 'face'], category: 'smileys' },
            { emoji: '😳', keywords: ['flushed', 'embarrassed', 'face'], category: 'smileys' },
            { emoji: '🥺', keywords: ['pleading', 'puppy', 'eyes', 'face'], category: 'smileys' },
            { emoji: '😦', keywords: ['frown', 'open', 'mouth', 'face'], category: 'smileys' },
            { emoji: '😧', keywords: ['anguish', 'face'], category: 'smileys' },
            { emoji: '😨', keywords: ['fear', 'scared', 'face'], category: 'smileys' },
            { emoji: '😰', keywords: ['anxious', 'sweat', 'face'], category: 'smileys' },
            { emoji: '😥', keywords: ['sad', 'relieved', 'face'], category: 'smileys' },
            { emoji: '😢', keywords: ['cry', 'sad', 'tear', 'face'], category: 'smileys' },
            { emoji: '😭', keywords: ['sob', 'cry', 'sad', 'face'], category: 'smileys' },
            { emoji: '😱', keywords: ['scream', 'fear', 'face'], category: 'smileys' },
            { emoji: '😖', keywords: ['confound', 'face'], category: 'smileys' },
            { emoji: '😣', keywords: ['persevere', 'face'], category: 'smileys' },
            { emoji: '😞', keywords: ['disappointed', 'sad', 'face'], category: 'smileys' },
            { emoji: '😓', keywords: ['sweat', 'face'], category: 'smileys' },
            { emoji: '😩', keywords: ['weary', 'tired', 'face'], category: 'smileys' },
            { emoji: '😫', keywords: ['tired', 'face'], category: 'smileys' },
            { emoji: '🥱', keywords: ['yawn', 'tired', 'face'], category: 'smileys' },
            { emoji: '😤', keywords: ['triumph', 'face'], category: 'smileys' },
            { emoji: '😡', keywords: ['angry', 'mad', 'face'], category: 'smileys' },
            { emoji: '😠', keywords: ['angry', 'face'], category: 'smileys' },
            { emoji: '🤬', keywords: ['swear', 'curse', 'face'], category: 'smileys' },
            { emoji: '😈', keywords: ['devil', 'smile', 'face'], category: 'smileys' },
            { emoji: '👿', keywords: ['devil', 'angry', 'face'], category: 'smileys' },
            { emoji: '💀', keywords: ['skull', 'death', 'dead'], category: 'smileys' },
            { emoji: '☠️', keywords: ['skull', 'crossbones', 'death'], category: 'smileys' },

            // Hearts & Love
            { emoji: '❤️', keywords: ['heart', 'love', 'red'], category: 'hearts' },
            { emoji: '🧡', keywords: ['heart', 'orange', 'love'], category: 'hearts' },
            { emoji: '💛', keywords: ['heart', 'yellow', 'love'], category: 'hearts' },
            { emoji: '💚', keywords: ['heart', 'green', 'love'], category: 'hearts' },
            { emoji: '💙', keywords: ['heart', 'blue', 'love'], category: 'hearts' },
            { emoji: '💜', keywords: ['heart', 'purple', 'love'], category: 'hearts' },
            { emoji: '🖤', keywords: ['heart', 'black', 'love'], category: 'hearts' },
            { emoji: '🤍', keywords: ['heart', 'white', 'love'], category: 'hearts' },
            { emoji: '🤎', keywords: ['heart', 'brown', 'love'], category: 'hearts' },
            { emoji: '💔', keywords: ['broken', 'heart', 'sad'], category: 'hearts' },
            { emoji: '❣️', keywords: ['heart', 'exclamation', 'love'], category: 'hearts' },
            { emoji: '💕', keywords: ['two', 'hearts', 'love'], category: 'hearts' },
            { emoji: '💞', keywords: ['revolving', 'hearts', 'love'], category: 'hearts' },
            { emoji: '💓', keywords: ['beating', 'heart', 'love'], category: 'hearts' },
            { emoji: '💗', keywords: ['growing', 'heart', 'love'], category: 'hearts' },
            { emoji: '💖', keywords: ['sparkling', 'heart', 'love'], category: 'hearts' },
            { emoji: '💘', keywords: ['arrow', 'heart', 'cupid', 'love'], category: 'hearts' },
            { emoji: '💝', keywords: ['gift', 'heart', 'love'], category: 'hearts' },

            // Hands & Body
            { emoji: '👍', keywords: ['thumbs', 'up', 'yes', 'like', 'good'], category: 'hands' },
            { emoji: '👎', keywords: ['thumbs', 'down', 'no', 'bad'], category: 'hands' },
            { emoji: '👊', keywords: ['fist', 'punch', 'bump'], category: 'hands' },
            { emoji: '✊', keywords: ['fist', 'raised', 'power'], category: 'hands' },
            { emoji: '🤛', keywords: ['fist', 'left', 'bump'], category: 'hands' },
            { emoji: '🤜', keywords: ['fist', 'right', 'bump'], category: 'hands' },
            { emoji: '👏', keywords: ['clap', 'applause', 'hands'], category: 'hands' },
            { emoji: '🙌', keywords: ['raised', 'hands', 'celebrate'], category: 'hands' },
            { emoji: '👐', keywords: ['open', 'hands'], category: 'hands' },
            { emoji: '🤲', keywords: ['palms', 'together', 'pray'], category: 'hands' },
            { emoji: '🤝', keywords: ['handshake', 'deal', 'agreement'], category: 'hands' },
            { emoji: '🙏', keywords: ['pray', 'thanks', 'please', 'hands'], category: 'hands' },
            { emoji: '✍️', keywords: ['write', 'hand', 'pen'], category: 'hands' },
            { emoji: '✋', keywords: ['hand', 'stop', 'raised'], category: 'hands' },
            { emoji: '🤚', keywords: ['raised', 'back', 'hand'], category: 'hands' },
            { emoji: '🖐️', keywords: ['hand', 'fingers', 'splayed'], category: 'hands' },
            { emoji: '✌️', keywords: ['victory', 'peace', 'hand'], category: 'hands' },
            { emoji: '🤞', keywords: ['fingers', 'crossed', 'luck'], category: 'hands' },
            { emoji: '🤟', keywords: ['love', 'you', 'hand'], category: 'hands' },
            { emoji: '🤘', keywords: ['rock', 'on', 'horns', 'hand'], category: 'hands' },
            { emoji: '👌', keywords: ['ok', 'hand', 'perfect'], category: 'hands' },
            { emoji: '🤌', keywords: ['pinched', 'fingers', 'hand'], category: 'hands' },
            { emoji: '👈', keywords: ['point', 'left', 'hand'], category: 'hands' },
            { emoji: '👉', keywords: ['point', 'right', 'hand'], category: 'hands' },
            { emoji: '👆', keywords: ['point', 'up', 'hand'], category: 'hands' },
            { emoji: '👇', keywords: ['point', 'down', 'hand'], category: 'hands' },
            { emoji: '☝️', keywords: ['point', 'up', 'index', 'hand'], category: 'hands' },
            { emoji: '🖕', keywords: ['middle', 'finger', 'hand'], category: 'hands' },
            { emoji: '💪', keywords: ['muscle', 'strong', 'flex', 'bicep'], category: 'hands' },

            // Nature & Weather
            { emoji: '🌞', keywords: ['sun', 'face', 'bright', 'weather'], category: 'nature' },
            { emoji: '🌝', keywords: ['moon', 'face', 'full', 'night'], category: 'nature' },
            { emoji: '🌛', keywords: ['moon', 'face', 'quarter', 'night'], category: 'nature' },
            { emoji: '🌜', keywords: ['moon', 'face', 'quarter', 'night'], category: 'nature' },
            { emoji: '🌚', keywords: ['moon', 'face', 'new', 'dark'], category: 'nature' },
            { emoji: '🌕', keywords: ['moon', 'full', 'night'], category: 'nature' },
            { emoji: '🌖', keywords: ['moon', 'waning', 'night'], category: 'nature' },
            { emoji: '🌗', keywords: ['moon', 'quarter', 'night'], category: 'nature' },
            { emoji: '🌘', keywords: ['moon', 'crescent', 'night'], category: 'nature' },
            { emoji: '🌑', keywords: ['moon', 'new', 'dark'], category: 'nature' },
            { emoji: '🌒', keywords: ['moon', 'waxing', 'night'], category: 'nature' },
            { emoji: '🌓', keywords: ['moon', 'quarter', 'night'], category: 'nature' },
            { emoji: '🌔', keywords: ['moon', 'waxing', 'night'], category: 'nature' },
            { emoji: '⭐', keywords: ['star', 'night', 'favorite'], category: 'nature' },
            { emoji: '🌟', keywords: ['star', 'glowing', 'sparkle'], category: 'nature' },
            { emoji: '✨', keywords: ['sparkles', 'shine', 'magic'], category: 'nature' },
            { emoji: '⚡', keywords: ['lightning', 'bolt', 'zap', 'electric'], category: 'nature' },
            { emoji: '☄️', keywords: ['comet', 'space'], category: 'nature' },
            { emoji: '💫', keywords: ['dizzy', 'star'], category: 'nature' },
            { emoji: '🔥', keywords: ['fire', 'flame', 'hot', 'burn'], category: 'nature' },
            { emoji: '💧', keywords: ['droplet', 'water', 'drop'], category: 'nature' },
            { emoji: '🌊', keywords: ['wave', 'water', 'ocean', 'sea'], category: 'nature' },
            { emoji: '🌈', keywords: ['rainbow', 'colors', 'weather'], category: 'nature' },
            { emoji: '☀️', keywords: ['sun', 'sunny', 'weather'], category: 'nature' },
            { emoji: '⛅', keywords: ['cloud', 'sun', 'weather'], category: 'nature' },
            { emoji: '☁️', keywords: ['cloud', 'weather'], category: 'nature' },
            { emoji: '🌤️', keywords: ['sun', 'cloud', 'weather'], category: 'nature' },
            { emoji: '⛈️', keywords: ['storm', 'cloud', 'lightning', 'weather'], category: 'nature' },
            { emoji: '🌧️', keywords: ['rain', 'cloud', 'weather'], category: 'nature' },
            { emoji: '⛄', keywords: ['snowman', 'snow', 'winter'], category: 'nature' },
            { emoji: '❄️', keywords: ['snowflake', 'snow', 'cold', 'winter'], category: 'nature' },
            { emoji: '🌬️', keywords: ['wind', 'blow', 'weather'], category: 'nature' },
            { emoji: '💨', keywords: ['dash', 'wind', 'fast'], category: 'nature' },
            { emoji: '🌪️', keywords: ['tornado', 'cyclone', 'weather'], category: 'nature' },
            { emoji: '🌫️', keywords: ['fog', 'weather'], category: 'nature' },
            { emoji: '🌲', keywords: ['tree', 'evergreen', 'pine', 'nature'], category: 'nature' },
            { emoji: '🌳', keywords: ['tree', 'deciduous', 'nature'], category: 'nature' },
            { emoji: '🌴', keywords: ['palm', 'tree', 'tropical'], category: 'nature' },
            { emoji: '🌱', keywords: ['seedling', 'plant', 'grow'], category: 'nature' },
            { emoji: '🌿', keywords: ['herb', 'leaf', 'plant'], category: 'nature' },
            { emoji: '☘️', keywords: ['shamrock', 'clover', 'luck'], category: 'nature' },
            { emoji: '🍀', keywords: ['clover', 'four', 'leaf', 'luck'], category: 'nature' },
            { emoji: '🌹', keywords: ['rose', 'flower', 'red'], category: 'nature' },
            { emoji: '🌺', keywords: ['hibiscus', 'flower'], category: 'nature' },
            { emoji: '🌻', keywords: ['sunflower', 'flower'], category: 'nature' },
            { emoji: '🌼', keywords: ['blossom', 'flower'], category: 'nature' },
            { emoji: '🌷', keywords: ['tulip', 'flower'], category: 'nature' },

            // Food & Drink
            { emoji: '🍕', keywords: ['pizza', 'food'], category: 'food' },
            { emoji: '🍔', keywords: ['burger', 'hamburger', 'food'], category: 'food' },
            { emoji: '🍟', keywords: ['fries', 'french', 'food'], category: 'food' },
            { emoji: '🌭', keywords: ['hotdog', 'food'], category: 'food' },
            { emoji: '🍿', keywords: ['popcorn', 'food', 'snack'], category: 'food' },
            { emoji: '🥓', keywords: ['bacon', 'food'], category: 'food' },
            { emoji: '🥚', keywords: ['egg', 'food'], category: 'food' },
            { emoji: '🍳', keywords: ['cooking', 'egg', 'food'], category: 'food' },
            { emoji: '🥞', keywords: ['pancakes', 'food'], category: 'food' },
            { emoji: '🧇', keywords: ['waffle', 'food'], category: 'food' },
            { emoji: '🍞', keywords: ['bread', 'food'], category: 'food' },
            { emoji: '🥐', keywords: ['croissant', 'food'], category: 'food' },
            { emoji: '🥖', keywords: ['baguette', 'bread', 'food'], category: 'food' },
            { emoji: '🧀', keywords: ['cheese', 'food'], category: 'food' },
            { emoji: '🥗', keywords: ['salad', 'food', 'healthy'], category: 'food' },
            { emoji: '🍝', keywords: ['spaghetti', 'pasta', 'food'], category: 'food' },
            { emoji: '🍜', keywords: ['ramen', 'noodles', 'food'], category: 'food' },
            { emoji: '🍲', keywords: ['stew', 'food'], category: 'food' },
            { emoji: '🍛', keywords: ['curry', 'rice', 'food'], category: 'food' },
            { emoji: '🍣', keywords: ['sushi', 'food'], category: 'food' },
            { emoji: '🍱', keywords: ['bento', 'box', 'food'], category: 'food' },
            { emoji: '🍤', keywords: ['shrimp', 'food'], category: 'food' },
            { emoji: '🍙', keywords: ['rice', 'ball', 'food'], category: 'food' },
            { emoji: '🍚', keywords: ['rice', 'food'], category: 'food' },
            { emoji: '🍘', keywords: ['cracker', 'rice', 'food'], category: 'food' },
            { emoji: '🥟', keywords: ['dumpling', 'food'], category: 'food' },
            { emoji: '🍢', keywords: ['oden', 'food'], category: 'food' },
            { emoji: '🍡', keywords: ['dango', 'food'], category: 'food' },
            { emoji: '🍧', keywords: ['shaved', 'ice', 'dessert'], category: 'food' },
            { emoji: '🍨', keywords: ['ice', 'cream', 'dessert'], category: 'food' },
            { emoji: '🍦', keywords: ['soft', 'ice', 'cream', 'dessert'], category: 'food' },
            { emoji: '🥧', keywords: ['pie', 'dessert'], category: 'food' },
            { emoji: '🍰', keywords: ['cake', 'dessert'], category: 'food' },
            { emoji: '🎂', keywords: ['birthday', 'cake', 'dessert'], category: 'food' },
            { emoji: '🧁', keywords: ['cupcake', 'dessert'], category: 'food' },
            { emoji: '🍮', keywords: ['custard', 'pudding', 'dessert'], category: 'food' },
            { emoji: '🍭', keywords: ['lollipop', 'candy'], category: 'food' },
            { emoji: '🍬', keywords: ['candy', 'sweet'], category: 'food' },
            { emoji: '🍫', keywords: ['chocolate', 'bar', 'candy'], category: 'food' },
            { emoji: '🍩', keywords: ['doughnut', 'donut', 'dessert'], category: 'food' },
            { emoji: '🍪', keywords: ['cookie', 'dessert'], category: 'food' },
            { emoji: '🍯', keywords: ['honey', 'pot'], category: 'food' },
            { emoji: '🍎', keywords: ['apple', 'red', 'fruit'], category: 'food' },
            { emoji: '🍏', keywords: ['apple', 'green', 'fruit'], category: 'food' },
            { emoji: '🍊', keywords: ['orange', 'tangerine', 'fruit'], category: 'food' },
            { emoji: '🍋', keywords: ['lemon', 'fruit'], category: 'food' },
            { emoji: '🍌', keywords: ['banana', 'fruit'], category: 'food' },
            { emoji: '🍉', keywords: ['watermelon', 'fruit'], category: 'food' },
            { emoji: '🍇', keywords: ['grapes', 'fruit'], category: 'food' },
            { emoji: '🍓', keywords: ['strawberry', 'fruit'], category: 'food' },
            { emoji: '🍈', keywords: ['melon', 'fruit'], category: 'food' },
            { emoji: '🍒', keywords: ['cherries', 'fruit'], category: 'food' },
            { emoji: '🍑', keywords: ['peach', 'fruit'], category: 'food' },
            { emoji: '🥭', keywords: ['mango', 'fruit'], category: 'food' },
            { emoji: '🍍', keywords: ['pineapple', 'fruit'], category: 'food' },
            { emoji: '🥥', keywords: ['coconut', 'fruit'], category: 'food' },
            { emoji: '🥝', keywords: ['kiwi', 'fruit'], category: 'food' },
            { emoji: '☕', keywords: ['coffee', 'drink', 'hot'], category: 'food' },
            { emoji: '🍵', keywords: ['tea', 'drink', 'hot'], category: 'food' },
            { emoji: '🧃', keywords: ['juice', 'box', 'drink'], category: 'food' },
            { emoji: '🥤', keywords: ['cup', 'straw', 'drink'], category: 'food' },
            { emoji: '🍶', keywords: ['sake', 'drink'], category: 'food' },
            { emoji: '🍺', keywords: ['beer', 'drink'], category: 'food' },
            { emoji: '🍻', keywords: ['beers', 'cheers', 'drink'], category: 'food' },
            { emoji: '🍷', keywords: ['wine', 'glass', 'drink'], category: 'food' },
            { emoji: '🥂', keywords: ['champagne', 'glasses', 'cheers', 'drink'], category: 'food' },
            { emoji: '🍸', keywords: ['cocktail', 'drink'], category: 'food' },
            { emoji: '🍹', keywords: ['tropical', 'drink'], category: 'food' },

            // Activities & Sports
            { emoji: '⚽', keywords: ['soccer', 'ball', 'sport'], category: 'activities' },
            { emoji: '🏀', keywords: ['basketball', 'ball', 'sport'], category: 'activities' },
            { emoji: '🏈', keywords: ['football', 'american', 'ball', 'sport'], category: 'activities' },
            { emoji: '⚾', keywords: ['baseball', 'ball', 'sport'], category: 'activities' },
            { emoji: '🥎', keywords: ['softball', 'ball', 'sport'], category: 'activities' },
            { emoji: '🎾', keywords: ['tennis', 'ball', 'sport'], category: 'activities' },
            { emoji: '🏐', keywords: ['volleyball', 'ball', 'sport'], category: 'activities' },
            { emoji: '🏉', keywords: ['rugby', 'ball', 'sport'], category: 'activities' },
            { emoji: '🎱', keywords: ['pool', '8', 'ball', 'sport'], category: 'activities' },
            { emoji: '🏓', keywords: ['ping', 'pong', 'table', 'tennis', 'sport'], category: 'activities' },
            { emoji: '🏸', keywords: ['badminton', 'sport'], category: 'activities' },
            { emoji: '🥅', keywords: ['goal', 'net', 'sport'], category: 'activities' },
            { emoji: '🏒', keywords: ['hockey', 'ice', 'sport'], category: 'activities' },
            { emoji: '🏑', keywords: ['hockey', 'field', 'sport'], category: 'activities' },
            { emoji: '🥍', keywords: ['lacrosse', 'sport'], category: 'activities' },
            { emoji: '🏏', keywords: ['cricket', 'sport'], category: 'activities' },
            { emoji: '🎯', keywords: ['dart', 'target', 'bullseye'], category: 'activities' },
            { emoji: '🎮', keywords: ['game', 'controller', 'video'], category: 'activities' },
            { emoji: '🎲', keywords: ['dice', 'game'], category: 'activities' },
            { emoji: '🎭', keywords: ['theater', 'masks', 'drama'], category: 'activities' },
            { emoji: '🎨', keywords: ['art', 'palette', 'paint'], category: 'activities' },
            { emoji: '🎬', keywords: ['movie', 'clapper', 'film'], category: 'activities' },
            { emoji: '🎤', keywords: ['microphone', 'sing', 'music'], category: 'activities' },
            { emoji: '🎧', keywords: ['headphones', 'music'], category: 'activities' },
            { emoji: '🎼', keywords: ['music', 'score'], category: 'activities' },
            { emoji: '🎹', keywords: ['keyboard', 'piano', 'music'], category: 'activities' },
            { emoji: '🥁', keywords: ['drum', 'music'], category: 'activities' },
            { emoji: '🎷', keywords: ['saxophone', 'music'], category: 'activities' },
            { emoji: '🎺', keywords: ['trumpet', 'music'], category: 'activities' },
            { emoji: '🎸', keywords: ['guitar', 'music'], category: 'activities' },
            { emoji: '🎻', keywords: ['violin', 'music'], category: 'activities' },

            // Objects & Symbols
            { emoji: '📱', keywords: ['phone', 'mobile', 'cell'], category: 'objects' },
            { emoji: '💻', keywords: ['laptop', 'computer'], category: 'objects' },
            { emoji: '⌨️', keywords: ['keyboard', 'computer'], category: 'objects' },
            { emoji: '🖥️', keywords: ['desktop', 'computer'], category: 'objects' },
            { emoji: '🖨️', keywords: ['printer'], category: 'objects' },
            { emoji: '🖱️', keywords: ['mouse', 'computer'], category: 'objects' },
            { emoji: '📷', keywords: ['camera', 'photo'], category: 'objects' },
            { emoji: '📸', keywords: ['camera', 'flash', 'photo'], category: 'objects' },
            { emoji: '📹', keywords: ['video', 'camera'], category: 'objects' },
            { emoji: '🎥', keywords: ['movie', 'camera', 'film'], category: 'objects' },
            { emoji: '📞', keywords: ['phone', 'telephone'], category: 'objects' },
            { emoji: '☎️', keywords: ['telephone', 'phone'], category: 'objects' },
            { emoji: '📺', keywords: ['tv', 'television'], category: 'objects' },
            { emoji: '📻', keywords: ['radio'], category: 'objects' },
            { emoji: '⏰', keywords: ['alarm', 'clock', 'time'], category: 'objects' },
            { emoji: '⏱️', keywords: ['stopwatch', 'timer'], category: 'objects' },
            { emoji: '⏲️', keywords: ['timer', 'clock'], category: 'objects' },
            { emoji: '⌚', keywords: ['watch', 'time'], category: 'objects' },
            { emoji: '📅', keywords: ['calendar', 'date'], category: 'objects' },
            { emoji: '📆', keywords: ['calendar', 'tear-off', 'date'], category: 'objects' },
            { emoji: '📝', keywords: ['memo', 'note', 'pencil', 'write'], category: 'objects' },
            { emoji: '✏️', keywords: ['pencil', 'write'], category: 'objects' },
            { emoji: '✒️', keywords: ['pen', 'black', 'write'], category: 'objects' },
            { emoji: '🖊️', keywords: ['pen', 'write'], category: 'objects' },
            { emoji: '🖋️', keywords: ['pen', 'fountain', 'write'], category: 'objects' },
            { emoji: '📔', keywords: ['notebook', 'decorative', 'write'], category: 'objects' },
            { emoji: '📕', keywords: ['book', 'closed', 'red'], category: 'objects' },
            { emoji: '📖', keywords: ['book', 'open', 'read'], category: 'objects' },
            { emoji: '📗', keywords: ['book', 'green'], category: 'objects' },
            { emoji: '📘', keywords: ['book', 'blue'], category: 'objects' },
            { emoji: '📙', keywords: ['book', 'orange'], category: 'objects' },
            { emoji: '📚', keywords: ['books', 'stack', 'library'], category: 'objects' },
            { emoji: '📓', keywords: ['notebook'], category: 'objects' },
            { emoji: '📒', keywords: ['ledger', 'notebook'], category: 'objects' },
            { emoji: '📃', keywords: ['page', 'curl'], category: 'objects' },
            { emoji: '📄', keywords: ['page', 'document'], category: 'objects' },
            { emoji: '📰', keywords: ['newspaper', 'news'], category: 'objects' },
            { emoji: '🗞️', keywords: ['newspaper', 'rolled'], category: 'objects' },
            { emoji: '📑', keywords: ['bookmark', 'tabs'], category: 'objects' },
            { emoji: '🔖', keywords: ['bookmark'], category: 'objects' },
            { emoji: '💰', keywords: ['money', 'bag', 'dollar'], category: 'objects' },
            { emoji: '💵', keywords: ['dollar', 'bill', 'money'], category: 'objects' },
            { emoji: '💴', keywords: ['yen', 'bill', 'money'], category: 'objects' },
            { emoji: '💶', keywords: ['euro', 'bill', 'money'], category: 'objects' },
            { emoji: '💷', keywords: ['pound', 'bill', 'money'], category: 'objects' },
            { emoji: '💳', keywords: ['credit', 'card'], category: 'objects' },
            { emoji: '💎', keywords: ['gem', 'diamond', 'jewel'], category: 'objects' },
            { emoji: '⚙️', keywords: ['gear', 'settings', 'cog'], category: 'objects' },
            { emoji: '🔧', keywords: ['wrench', 'tool'], category: 'objects' },
            { emoji: '🔨', keywords: ['hammer', 'tool'], category: 'objects' },
            { emoji: '⚒️', keywords: ['hammer', 'pick', 'tool'], category: 'objects' },
            { emoji: '🛠️', keywords: ['tools', 'hammer', 'wrench'], category: 'objects' },
            { emoji: '🔩', keywords: ['nut', 'bolt'], category: 'objects' },
            { emoji: '⚡', keywords: ['lightning', 'zap', 'electric', 'fast'], category: 'objects' },
            { emoji: '🔥', keywords: ['fire', 'flame', 'hot'], category: 'objects' },
            { emoji: '💡', keywords: ['bulb', 'light', 'idea'], category: 'objects' },
            { emoji: '🔦', keywords: ['flashlight', 'torch'], category: 'objects' },
            { emoji: '🔔', keywords: ['bell', 'notification'], category: 'objects' },
            { emoji: '🔕', keywords: ['bell', 'slash', 'mute'], category: 'objects' },
            { emoji: '📢', keywords: ['loudspeaker', 'announcement'], category: 'objects' },
            { emoji: '📣', keywords: ['megaphone', 'cheering'], category: 'objects' },
            { emoji: '📯', keywords: ['horn', 'postal'], category: 'objects' },
            { emoji: '🎺', keywords: ['trumpet', 'horn'], category: 'objects' },
            { emoji: '🔑', keywords: ['key', 'lock'], category: 'objects' },
            { emoji: '🗝️', keywords: ['key', 'old'], category: 'objects' },
            { emoji: '🔐', keywords: ['locked', 'key'], category: 'objects' },
            { emoji: '🔒', keywords: ['locked', 'lock'], category: 'objects' },
            { emoji: '🔓', keywords: ['unlocked', 'open'], category: 'objects' },

            // Symbols & Arrows
            { emoji: '✅', keywords: ['check', 'mark', 'green', 'done', 'yes'], category: 'symbols' },
            { emoji: '✔️', keywords: ['check', 'mark', 'done', 'yes'], category: 'symbols' },
            { emoji: '❌', keywords: ['x', 'cross', 'mark', 'no', 'wrong'], category: 'symbols' },
            { emoji: '❎', keywords: ['x', 'cross', 'mark', 'button', 'no'], category: 'symbols' },
            { emoji: '⭕', keywords: ['circle', 'o', 'hollow'], category: 'symbols' },
            { emoji: '➕', keywords: ['plus', 'add', 'heavy'], category: 'symbols' },
            { emoji: '➖', keywords: ['minus', 'subtract', 'heavy'], category: 'symbols' },
            { emoji: '➗', keywords: ['divide', 'division', 'heavy'], category: 'symbols' },
            { emoji: '✖️', keywords: ['multiply', 'multiplication', 'heavy', 'x'], category: 'symbols' },
            { emoji: '🟰', keywords: ['equals', 'heavy'], category: 'symbols' },
            { emoji: '‼️', keywords: ['exclamation', 'double', 'mark'], category: 'symbols' },
            { emoji: '⁉️', keywords: ['question', 'exclamation', 'mark'], category: 'symbols' },
            { emoji: '❓', keywords: ['question', 'mark', 'red'], category: 'symbols' },
            { emoji: '❔', keywords: ['question', 'mark', 'white'], category: 'symbols' },
            { emoji: '❕', keywords: ['exclamation', 'mark', 'white'], category: 'symbols' },
            { emoji: '❗', keywords: ['exclamation', 'mark', 'red'], category: 'symbols' },
            { emoji: '⚠️', keywords: ['warning', 'caution'], category: 'symbols' },
            { emoji: '🚫', keywords: ['prohibited', 'forbidden', 'no'], category: 'symbols' },
            { emoji: '🔞', keywords: ['no', 'under', '18', 'adult'], category: 'symbols' },
            { emoji: '☢️', keywords: ['radioactive', 'radiation'], category: 'symbols' },
            { emoji: '☣️', keywords: ['biohazard', 'danger'], category: 'symbols' },
            { emoji: '⬆️', keywords: ['arrow', 'up', 'north'], category: 'symbols' },
            { emoji: '↗️', keywords: ['arrow', 'up', 'right', 'northeast'], category: 'symbols' },
            { emoji: '➡️', keywords: ['arrow', 'right', 'east'], category: 'symbols' },
            { emoji: '↘️', keywords: ['arrow', 'down', 'right', 'southeast'], category: 'symbols' },
            { emoji: '⬇️', keywords: ['arrow', 'down', 'south'], category: 'symbols' },
            { emoji: '↙️', keywords: ['arrow', 'down', 'left', 'southwest'], category: 'symbols' },
            { emoji: '⬅️', keywords: ['arrow', 'left', 'west'], category: 'symbols' },
            { emoji: '↖️', keywords: ['arrow', 'up', 'left', 'northwest'], category: 'symbols' },
            { emoji: '↕️', keywords: ['arrow', 'up', 'down'], category: 'symbols' },
            { emoji: '↔️', keywords: ['arrow', 'left', 'right'], category: 'symbols' },
            { emoji: '↩️', keywords: ['arrow', 'left', 'curve'], category: 'symbols' },
            { emoji: '↪️', keywords: ['arrow', 'right', 'curve'], category: 'symbols' },
            { emoji: '⤴️', keywords: ['arrow', 'up', 'curve'], category: 'symbols' },
            { emoji: '⤵️', keywords: ['arrow', 'down', 'curve'], category: 'symbols' },
            { emoji: '🔃', keywords: ['arrows', 'clockwise', 'vertical'], category: 'symbols' },
            { emoji: '🔄', keywords: ['arrows', 'counterclockwise', 'button'], category: 'symbols' },
            { emoji: '🔙', keywords: ['back', 'arrow'], category: 'symbols' },
            { emoji: '🔚', keywords: ['end', 'arrow'], category: 'symbols' },
            { emoji: '🔛', keywords: ['on', 'arrow'], category: 'symbols' },
            { emoji: '🔜', keywords: ['soon', 'arrow'], category: 'symbols' },
            { emoji: '🔝', keywords: ['top', 'arrow', 'up'], category: 'symbols' },
            { emoji: '♻️', keywords: ['recycle', 'symbol'], category: 'symbols' },
            { emoji: '⚜️', keywords: ['fleur-de-lis'], category: 'symbols' },
            { emoji: '🔱', keywords: ['trident', 'emblem'], category: 'symbols' },
            { emoji: '📛', keywords: ['name', 'badge'], category: 'symbols' },
            { emoji: '⭐', keywords: ['star', 'white', 'medium'], category: 'symbols' },
            { emoji: '🌟', keywords: ['star', 'glowing'], category: 'symbols' },
            { emoji: '💫', keywords: ['dizzy', 'star'], category: 'symbols' },
            { emoji: '✨', keywords: ['sparkles', 'shine'], category: 'symbols' },
            { emoji: '⚡', keywords: ['lightning', 'bolt', 'zap'], category: 'symbols' },
            { emoji: '☄️', keywords: ['comet'], category: 'symbols' },
            { emoji: '💥', keywords: ['collision', 'boom', 'bang'], category: 'symbols' },
            { emoji: '🔆', keywords: ['bright', 'button'], category: 'symbols' },
            { emoji: '🔅', keywords: ['dim', 'button'], category: 'symbols' },
            { emoji: '💤', keywords: ['zzz', 'sleep'], category: 'symbols' },
            { emoji: '💢', keywords: ['anger', 'symbol'], category: 'symbols' },
            { emoji: '💬', keywords: ['speech', 'balloon', 'chat'], category: 'symbols' },
            { emoji: '💭', keywords: ['thought', 'balloon'], category: 'symbols' },
            { emoji: '🗯️', keywords: ['anger', 'balloon'], category: 'symbols' },

            // Travel & Places
            { emoji: '🚗', keywords: ['car', 'automobile', 'vehicle'], category: 'travel' },
            { emoji: '🚕', keywords: ['taxi', 'car', 'vehicle'], category: 'travel' },
            { emoji: '🚙', keywords: ['suv', 'car', 'vehicle'], category: 'travel' },
            { emoji: '🚌', keywords: ['bus', 'vehicle'], category: 'travel' },
            { emoji: '🚎', keywords: ['trolleybus', 'vehicle'], category: 'travel' },
            { emoji: '🏎️', keywords: ['race', 'car', 'vehicle'], category: 'travel' },
            { emoji: '🚓', keywords: ['police', 'car', 'vehicle'], category: 'travel' },
            { emoji: '🚑', keywords: ['ambulance', 'vehicle'], category: 'travel' },
            { emoji: '🚒', keywords: ['fire', 'engine', 'truck'], category: 'travel' },
            { emoji: '🚐', keywords: ['minibus', 'vehicle'], category: 'travel' },
            { emoji: '🚚', keywords: ['truck', 'delivery', 'vehicle'], category: 'travel' },
            { emoji: '🚛', keywords: ['truck', 'articulated', 'vehicle'], category: 'travel' },
            { emoji: '🚜', keywords: ['tractor', 'vehicle'], category: 'travel' },
            { emoji: '🏍️', keywords: ['motorcycle', 'vehicle'], category: 'travel' },
            { emoji: '🛵', keywords: ['scooter', 'motor', 'vehicle'], category: 'travel' },
            { emoji: '🚲', keywords: ['bike', 'bicycle', 'vehicle'], category: 'travel' },
            { emoji: '🛴', keywords: ['scooter', 'kick', 'vehicle'], category: 'travel' },
            { emoji: '✈️', keywords: ['airplane', 'plane', 'flight'], category: 'travel' },
            { emoji: '🛫', keywords: ['airplane', 'departure', 'takeoff'], category: 'travel' },
            { emoji: '🛬', keywords: ['airplane', 'arrival', 'landing'], category: 'travel' },
            { emoji: '🚁', keywords: ['helicopter', 'vehicle'], category: 'travel' },
            { emoji: '🚂', keywords: ['train', 'locomotive', 'vehicle'], category: 'travel' },
            { emoji: '🚆', keywords: ['train', 'vehicle'], category: 'travel' },
            { emoji: '🚇', keywords: ['metro', 'subway', 'train'], category: 'travel' },
            { emoji: '🚊', keywords: ['tram', 'vehicle'], category: 'travel' },
            { emoji: '🚝', keywords: ['monorail', 'vehicle'], category: 'travel' },
            { emoji: '🚄', keywords: ['train', 'bullet', 'high-speed'], category: 'travel' },
            { emoji: '🚅', keywords: ['train', 'bullet', 'high-speed'], category: 'travel' },
            { emoji: '🚈', keywords: ['train', 'light', 'rail'], category: 'travel' },
            { emoji: '🚞', keywords: ['train', 'mountain', 'railway'], category: 'travel' },
            { emoji: '🚋', keywords: ['tram', 'car'], category: 'travel' },
            { emoji: '🚃', keywords: ['train', 'railway', 'car'], category: 'travel' },
            { emoji: '🚟', keywords: ['railway', 'suspension'], category: 'travel' },
            { emoji: '🚠', keywords: ['cable', 'car', 'mountain'], category: 'travel' },
            { emoji: '🚡', keywords: ['aerial', 'tramway'], category: 'travel' },
            { emoji: '🚢', keywords: ['ship', 'boat'], category: 'travel' },
            { emoji: '⛵', keywords: ['sailboat', 'boat'], category: 'travel' },
            { emoji: '🛶', keywords: ['canoe', 'boat'], category: 'travel' },
            { emoji: '🚤', keywords: ['speedboat', 'boat'], category: 'travel' },
            { emoji: '🛳️', keywords: ['ship', 'passenger'], category: 'travel' },
            { emoji: '⛴️', keywords: ['ferry', 'boat'], category: 'travel' },
            { emoji: '🛥️', keywords: ['boat', 'motor'], category: 'travel' },
            { emoji: '🚀', keywords: ['rocket', 'space', 'launch'], category: 'travel' },
            { emoji: '🛸', keywords: ['ufo', 'flying', 'saucer'], category: 'travel' },
            { emoji: '⏱️', keywords: ['stopwatch', 'timer'], category: 'travel' },
            { emoji: '⏰', keywords: ['alarm', 'clock'], category: 'travel' },
            { emoji: '⏲️', keywords: ['timer', 'clock'], category: 'travel' },
            { emoji: '🕐', keywords: ['clock', 'one', 'time'], category: 'travel' },
            { emoji: '🏠', keywords: ['house', 'home'], category: 'travel' },
            { emoji: '🏡', keywords: ['house', 'garden', 'home'], category: 'travel' },
            { emoji: '🏢', keywords: ['building', 'office'], category: 'travel' },
            { emoji: '🏣', keywords: ['post', 'office'], category: 'travel' },
            { emoji: '🏤', keywords: ['post', 'office', 'european'], category: 'travel' },
            { emoji: '🏥', keywords: ['hospital', 'medical'], category: 'travel' },
            { emoji: '🏦', keywords: ['bank', 'building'], category: 'travel' },
            { emoji: '🏨', keywords: ['hotel', 'building'], category: 'travel' },
            { emoji: '🏩', keywords: ['hotel', 'love'], category: 'travel' },
            { emoji: '🏪', keywords: ['store', 'convenience'], category: 'travel' },
            { emoji: '🏫', keywords: ['school', 'building'], category: 'travel' },
            { emoji: '🏬', keywords: ['store', 'department'], category: 'travel' },
            { emoji: '🏭', keywords: ['factory', 'building'], category: 'travel' },
            { emoji: '🏯', keywords: ['castle', 'japanese'], category: 'travel' },
            { emoji: '🏰', keywords: ['castle', 'european'], category: 'travel' },
            { emoji: '💒', keywords: ['wedding', 'chapel'], category: 'travel' },
            { emoji: '🗼', keywords: ['tower', 'tokyo'], category: 'travel' },
            { emoji: '🗽', keywords: ['statue', 'liberty'], category: 'travel' },
            { emoji: '⛪', keywords: ['church', 'christian'], category: 'travel' },
            { emoji: '🕌', keywords: ['mosque', 'islam'], category: 'travel' },
            { emoji: '🛕', keywords: ['temple', 'hindu'], category: 'travel' },
            { emoji: '🕍', keywords: ['synagogue', 'jewish'], category: 'travel' },
        ];

        // Add emojis to library
        emojis.forEach(({ emoji, keywords, category }) => {
            items.push({
                value: emoji,
                type: 'emoji',
                keywords: keywords,
                category: category
            });
        });

        // Add Lucide icons
        const lucideIcons = this.getLucideIcons();
        lucideIcons.forEach(iconName => {
            // Skip if icon doesn't exist
            if (!getIcon(iconName)) return;

            // Convert icon name to keywords (split by hyphen)
            const keywords = iconName.split('-');

            items.push({
                value: iconName,
                type: 'lucide',
                keywords: keywords,
                category: 'lucide'
            });
        });

        return items;
    }

    /**
     * Get comprehensive list of Lucide icon names
     * Full library from https://lucide.dev/icons/
     */
    getLucideIcons(): string[] {
        return [
            'a-arrow-down', 'a-arrow-up', 'a-large-small', 'accessibility', 'activity',
            'air-vent', 'airplay', 'alarm-check', 'alarm-clock', 'alarm-clock-check', 'alarm-clock-minus',
            'alarm-clock-off', 'alarm-clock-plus', 'alarm-minus', 'alarm-plus', 'alarm-smoke',
            'album', 'alert-circle', 'alert-octagon', 'alert-triangle', 'align-center',
            'align-center-horizontal', 'align-center-vertical', 'align-end-horizontal', 'align-end-vertical',
            'align-horizontal-distribute-center', 'align-horizontal-distribute-end', 'align-horizontal-distribute-start',
            'align-horizontal-justify-center', 'align-horizontal-justify-end', 'align-horizontal-justify-start',
            'align-horizontal-space-around', 'align-horizontal-space-between', 'align-justify', 'align-left', 'align-right',
            'align-start-horizontal', 'align-start-vertical', 'align-vertical-distribute-center',
            'align-vertical-distribute-end', 'align-vertical-distribute-start', 'align-vertical-justify-center',
            'align-vertical-justify-end', 'align-vertical-justify-start', 'align-vertical-space-around',
            'align-vertical-space-between', 'ambulance', 'ampersand', 'ampersands', 'anchor', 'angry',
            'annoyed', 'antenna', 'anvil', 'aperture', 'app-window', 'app-window-mac', 'apple',
            'archive', 'archive-restore', 'archive-x', 'area-chart', 'armchair', 'arrow-big-down',
            'arrow-big-down-dash', 'arrow-big-left', 'arrow-big-left-dash', 'arrow-big-right',
            'arrow-big-right-dash', 'arrow-big-up', 'arrow-big-up-dash', 'arrow-down', 'arrow-down-0-1',
            'arrow-down-1-0', 'arrow-down-a-z', 'arrow-down-circle', 'arrow-down-from-line',
            'arrow-down-left', 'arrow-down-left-from-circle', 'arrow-down-left-from-square',
            'arrow-down-narrow-wide', 'arrow-down-right', 'arrow-down-right-from-circle',
            'arrow-down-right-from-square', 'arrow-down-square', 'arrow-down-to-dot', 'arrow-down-to-line',
            'arrow-down-up', 'arrow-down-wide-narrow', 'arrow-down-z-a', 'arrow-left', 'arrow-left-circle',
            'arrow-left-from-line', 'arrow-left-right', 'arrow-left-square', 'arrow-left-to-line',
            'arrow-right', 'arrow-right-circle', 'arrow-right-from-line', 'arrow-right-left',
            'arrow-right-square', 'arrow-right-to-line', 'arrow-up', 'arrow-up-0-1', 'arrow-up-1-0',
            'arrow-up-a-z', 'arrow-up-circle', 'arrow-up-down', 'arrow-up-from-dot', 'arrow-up-from-line',
            'arrow-up-left', 'arrow-up-left-from-circle', 'arrow-up-left-from-square',
            'arrow-up-narrow-wide', 'arrow-up-right', 'arrow-up-right-from-circle',
            'arrow-up-right-from-square', 'arrow-up-square', 'arrow-up-to-line', 'arrow-up-wide-narrow',
            'arrow-up-z-a', 'arrows-up-from-line', 'asterisk', 'at-sign', 'atom', 'audio-lines',
            'audio-waveform', 'award', 'axe', 'axis-3d', 'baby', 'backpack', 'badge', 'badge-alert',
            'badge-cent', 'badge-check', 'badge-dollar-sign', 'badge-euro', 'badge-help',
            'badge-indian-rupee', 'badge-info', 'badge-japanese-yen', 'badge-minus', 'badge-percent',
            'badge-plus', 'badge-pound-sterling', 'badge-russian-ruble', 'badge-swiss-franc', 'badge-x',
            'baggage-claim', 'ban', 'banana', 'banknote', 'bar-chart', 'bar-chart-2', 'bar-chart-3',
            'bar-chart-4', 'bar-chart-big', 'bar-chart-horizontal', 'bar-chart-horizontal-big', 'barcode',
            'baseline', 'bath', 'battery', 'battery-charging', 'battery-full', 'battery-low',
            'battery-medium', 'battery-warning', 'beaker', 'bean', 'bean-off', 'bed', 'bed-double',
            'bed-single', 'beef', 'beer', 'beer-off', 'bell', 'bell-dot', 'bell-electric', 'bell-minus',
            'bell-off', 'bell-plus', 'bell-ring', 'between-horizontal-end', 'between-horizontal-start',
            'between-vertical-end', 'between-vertical-start', 'bicycle', 'bike', 'binary', 'binoculars',
            'biohazard', 'bird', 'bitcoin', 'blend', 'blinds', 'blocks', 'bluetooth',
            'bluetooth-connected', 'bluetooth-off', 'bluetooth-searching', 'bold', 'bolt', 'bomb', 'bone',
            'book', 'book-a', 'book-audio', 'book-check', 'book-copy', 'book-dashed', 'book-down',
            'book-headphones', 'book-heart', 'book-image', 'book-key', 'book-lock', 'book-marked',
            'book-minus', 'book-open', 'book-open-check', 'book-open-text', 'book-plus', 'book-text',
            'book-type', 'book-up', 'book-up-2', 'book-user', 'book-x', 'bookmark', 'bookmark-check',
            'bookmark-minus', 'bookmark-plus', 'bookmark-x', 'boom-box', 'bot', 'bot-message-square',
            'box', 'box-select', 'boxes', 'braces', 'brackets', 'brain', 'brain-circuit', 'brain-cog',
            'brick-wall', 'briefcase', 'briefcase-business', 'briefcase-conveyor-belt',
            'briefcase-medical', 'bring-to-front', 'brush', 'bug', 'bug-off', 'bug-play', 'building',
            'building-2', 'bus', 'bus-front', 'cable', 'cable-car', 'cake', 'cake-slice', 'calculator',
            'calendar', 'calendar-arrow-down', 'calendar-arrow-up', 'calendar-check', 'calendar-check-2',
            'calendar-clock', 'calendar-cog', 'calendar-days', 'calendar-fold', 'calendar-heart',
            'calendar-minus', 'calendar-minus-2', 'calendar-off', 'calendar-plus', 'calendar-plus-2',
            'calendar-range', 'calendar-search', 'calendar-sync', 'calendar-x', 'calendar-x-2', 'camera',
            'camera-off', 'camping-tent', 'candy', 'candy-cane', 'candy-off', 'cannabis', 'captions',
            'captions-off', 'car', 'car-front', 'car-taxi-front', 'caravan', 'carrot', 'case-lower',
            'case-sensitive', 'case-upper', 'cassette-tape', 'cast', 'castle', 'cat', 'cctv', 'check',
            'check-check', 'check-circle', 'check-circle-2', 'check-square', 'check-square-2',
            'chef-hat', 'cherry', 'chevron-down', 'chevron-down-circle', 'chevron-down-square',
            'chevron-first', 'chevron-last', 'chevron-left', 'chevron-left-circle', 'chevron-left-square',
            'chevron-right', 'chevron-right-circle', 'chevron-right-square', 'chevron-up',
            'chevron-up-circle', 'chevron-up-square', 'chevrons-down', 'chevrons-down-up',
            'chevrons-left', 'chevrons-left-right', 'chevrons-left-right-ellipsis', 'chevrons-right',
            'chevrons-right-left', 'chevrons-up', 'chevrons-up-down', 'chrome', 'church', 'cigarette',
            'cigarette-off', 'circle', 'circle-alert', 'circle-arrow-down', 'circle-arrow-left',
            'circle-arrow-out-down-left', 'circle-arrow-out-down-right', 'circle-arrow-out-up-left',
            'circle-arrow-out-up-right', 'circle-arrow-right', 'circle-arrow-up', 'circle-check',
            'circle-check-big', 'circle-chevron-down', 'circle-chevron-left', 'circle-chevron-right',
            'circle-chevron-up', 'circle-dashed', 'circle-divide', 'circle-dollar-sign', 'circle-dot',
            'circle-dot-dashed', 'circle-ellipsis', 'circle-equal', 'circle-fading-arrow-up',
            'circle-fading-plus', 'circle-gauge', 'circle-help', 'circle-minus', 'circle-off',
            'circle-parking', 'circle-parking-off', 'circle-pause', 'circle-percent', 'circle-play',
            'circle-plus', 'circle-power', 'circle-slash', 'circle-slash-2', 'circle-stop', 'circle-user',
            'circle-user-round', 'circle-x', 'circuit-board', 'citrus', 'clapperboard', 'clipboard',
            'clipboard-check', 'clipboard-copy', 'clipboard-edit', 'clipboard-list', 'clipboard-minus',
            'clipboard-paste', 'clipboard-pen', 'clipboard-pen-line', 'clipboard-plus',
            'clipboard-signature', 'clipboard-type', 'clipboard-x', 'clock', 'clock-1', 'clock-10',
            'clock-11', 'clock-12', 'clock-2', 'clock-3', 'clock-4', 'clock-5', 'clock-6', 'clock-7',
            'clock-8', 'clock-9', 'clock-alert', 'clock-arrow-down', 'clock-arrow-up', 'cloud',
            'cloud-cog', 'cloud-download', 'cloud-drizzle', 'cloud-fog', 'cloud-hail', 'cloud-lightning',
            'cloud-moon', 'cloud-moon-rain', 'cloud-off', 'cloud-rain', 'cloud-rain-wind', 'cloud-snow',
            'cloud-sun', 'cloud-sun-rain', 'cloud-upload', 'cloudy', 'clover', 'club', 'code', 'code-2',
            'code-xml', 'codepen', 'codesandbox', 'coffee', 'cog', 'coins', 'columns-2', 'columns-3',
            'columns-4', 'combine', 'command', 'compass', 'component', 'computer', 'concierge-bell',
            'cone', 'construction', 'contact', 'contact-round', 'container', 'contrast', 'cookie',
            'cooking-pot', 'copy', 'copy-check', 'copy-minus', 'copy-plus', 'copy-slash', 'copy-x',
            'copyleft', 'copyright', 'corner-down-left', 'corner-down-right', 'corner-left-down',
            'corner-left-up', 'corner-right-down', 'corner-right-up', 'corner-up-left',
            'corner-up-right', 'cpu', 'creative-commons', 'credit-card', 'croissant', 'crop', 'cross',
            'crosshair', 'crown', 'cuboid', 'cup-soda', 'currency', 'cylinder', 'database',
            'database-backup', 'database-zap', 'delete', 'dessert', 'diameter', 'diamond',
            'diamond-minus', 'diamond-percent', 'diamond-plus', 'dice-1', 'dice-2', 'dice-3', 'dice-4',
            'dice-5', 'dice-6', 'dices', 'diff', 'disc', 'disc-2', 'disc-3', 'disc-album', 'divide',
            'divide-circle', 'divide-square', 'dna', 'dna-off', 'dock', 'dog', 'dollar-sign', 'donut',
            'door-closed', 'door-open', 'dot', 'download', 'download-cloud', 'drafting-compass',
            'drama', 'dribbble', 'drill', 'droplet', 'droplets', 'drumstick', 'dumbbell', 'ear',
            'ear-off', 'earth', 'earth-lock', 'eclipse', 'egg', 'egg-fried', 'egg-off', 'ellipsis',
            'ellipsis-vertical', 'equal', 'equal-not', 'eraser', 'euro', 'expand', 'external-link',
            'eye', 'eye-closed', 'eye-off', 'facebook', 'factory', 'fan', 'fast-forward', 'feather',
            'fence', 'ferris-wheel', 'figma', 'file', 'file-archive', 'file-audio', 'file-audio-2',
            'file-axis-3d', 'file-badge', 'file-badge-2', 'file-bar-chart', 'file-bar-chart-2',
            'file-box', 'file-check', 'file-check-2', 'file-clock', 'file-code', 'file-code-2',
            'file-cog', 'file-diff', 'file-digit', 'file-down', 'file-edit', 'file-heart', 'file-image',
            'file-input', 'file-json', 'file-json-2', 'file-key', 'file-key-2', 'file-line-chart',
            'file-lock', 'file-lock-2', 'file-minus', 'file-minus-2', 'file-music', 'file-output',
            'file-pen', 'file-pen-line', 'file-pie-chart', 'file-plus', 'file-plus-2', 'file-question',
            'file-scan', 'file-search', 'file-search-2', 'file-signature', 'file-sliders',
            'file-spreadsheet', 'file-stack', 'file-symlink', 'file-terminal', 'file-text', 'file-type',
            'file-type-2', 'file-up', 'file-user', 'file-video', 'file-video-2', 'file-volume',
            'file-volume-2', 'file-warning', 'file-x', 'file-x-2', 'files', 'film', 'filter',
            'filter-x', 'fingerprint', 'fire-extinguisher', 'fish', 'fish-off', 'fish-symbol', 'flag',
            'flag-off', 'flag-triangle-left', 'flag-triangle-right', 'flame', 'flame-kindling',
            'flashlight', 'flashlight-off', 'flask-conical', 'flask-conical-off', 'flask-round',
            'flip-horizontal', 'flip-horizontal-2', 'flip-vertical', 'flip-vertical-2', 'flower',
            'flower-2', 'focus', 'fold-horizontal', 'fold-vertical', 'folder', 'folder-archive',
            'folder-check', 'folder-clock', 'folder-closed', 'folder-cog', 'folder-dot', 'folder-down',
            'folder-edit', 'folder-git', 'folder-git-2', 'folder-heart', 'folder-input', 'folder-kanban',
            'folder-key', 'folder-lock', 'folder-minus', 'folder-open', 'folder-open-dot',
            'folder-output', 'folder-pen', 'folder-plus', 'folder-root', 'folder-search',
            'folder-search-2', 'folder-symlink', 'folder-sync', 'folder-tree', 'folder-up', 'folder-x',
            'folders', 'footprints', 'forklift', 'form-input', 'forward', 'frame', 'framer', 'frown',
            'fuel', 'fullscreen', 'function-square', 'gallery-horizontal', 'gallery-horizontal-end',
            'gallery-thumbnails', 'gallery-vertical', 'gallery-vertical-end', 'gamepad', 'gamepad-2',
            'gauge', 'gauge-circle', 'gavel', 'gem', 'ghost', 'gift', 'git-branch', 'git-branch-plus',
            'git-commit-horizontal', 'git-commit-vertical', 'git-compare', 'git-compare-arrows',
            'git-fork', 'git-graph', 'git-merge', 'git-pull-request', 'git-pull-request-arrow',
            'git-pull-request-closed', 'git-pull-request-create', 'git-pull-request-create-arrow',
            'git-pull-request-draft', 'github', 'gitlab', 'glass-water', 'glasses', 'globe', 'globe-2',
            'globe-lock', 'goal', 'grab', 'graduation-cap', 'grape', 'grid-2x2', 'grid-2x2-check',
            'grid-2x2-plus', 'grid-2x2-x', 'grid-3x3', 'grip', 'grip-horizontal', 'grip-vertical',
            'group', 'guitar', 'ham', 'hammer', 'hand', 'hand-coins', 'hand-heart', 'hand-helping',
            'hand-metal', 'hand-platter', 'handshake', 'hard-drive', 'hard-drive-download',
            'hard-drive-upload', 'hard-hat', 'hash', 'haze', 'hdmi-port', 'heading', 'heading-1',
            'heading-2', 'heading-3', 'heading-4', 'heading-5', 'heading-6', 'headphone-off',
            'headphones', 'headset', 'heart', 'heart-crack', 'heart-handshake', 'heart-off',
            'heart-pulse', 'heater', 'help-circle', 'hexagon', 'highlighter', 'history', 'hop',
            'hop-off', 'hospital', 'hotel', 'hourglass', 'house', 'house-plus', 'ice-cream',
            'ice-cream-bowl', 'ice-cream-cone', 'image', 'image-down', 'image-minus', 'image-off',
            'image-play', 'image-plus', 'image-up', 'images', 'import', 'inbox', 'indent-decrease',
            'indent-increase', 'indian-rupee', 'infinity', 'info', 'inspection-panel', 'instagram',
            'italic', 'iteration-ccw', 'iteration-cw', 'japanese-yen', 'joystick', 'kanban', 'key',
            'key-round', 'key-square', 'keyboard', 'keyboard-music', 'keyboard-off', 'lamp',
            'lamp-ceiling', 'lamp-desk', 'lamp-floor', 'lamp-wall-down', 'lamp-wall-up', 'land-plot',
            'landmark', 'languages', 'laptop', 'laptop-2', 'laptop-minimal', 'lasso', 'lasso-select',
            'laugh', 'layers', 'layers-2', 'layers-3', 'layout', 'layout-dashboard', 'layout-grid',
            'layout-list', 'layout-panel-left', 'layout-panel-top', 'layout-template', 'leaf',
            'leafy-green', 'lectern', 'library', 'library-big', 'library-square', 'life-buoy',
            'ligature', 'lightbulb', 'lightbulb-off', 'line-chart', 'link', 'link-2', 'link-2-off',
            'linkedin', 'list', 'list-check', 'list-checks', 'list-collapse', 'list-end', 'list-filter',
            'list-minus', 'list-music', 'list-ordered', 'list-plus', 'list-restart', 'list-start',
            'list-todo', 'list-tree', 'list-video', 'list-x', 'loader', 'loader-circle',
            'loader-pinwheel', 'locate', 'locate-fixed', 'locate-off', 'lock', 'lock-keyhole',
            'lock-keyhole-open', 'lock-open', 'log-in', 'log-out', 'logs', 'lollipop', 'luggage',
            'magnet', 'mail', 'mail-check', 'mail-minus', 'mail-open', 'mail-plus', 'mail-question',
            'mail-search', 'mail-warning', 'mail-x', 'mailbox', 'mails', 'map', 'map-pin',
            'map-pin-off', 'map-pinned', 'martini', 'maximize', 'maximize-2', 'medal', 'megaphone',
            'megaphone-off', 'meh', 'memory-stick', 'menu', 'merge', 'message-circle',
            'message-circle-code', 'message-circle-dashed', 'message-circle-heart',
            'message-circle-more', 'message-circle-off', 'message-circle-plus', 'message-circle-question',
            'message-circle-reply', 'message-circle-warning', 'message-circle-x', 'message-square',
            'message-square-code', 'message-square-dashed', 'message-square-diff', 'message-square-dot',
            'message-square-heart', 'message-square-more', 'message-square-off', 'message-square-plus',
            'message-square-quote', 'message-square-reply', 'message-square-share', 'message-square-text',
            'message-square-warning', 'message-square-x', 'messages-square', 'mic', 'mic-off',
            'mic-vocal', 'microchip', 'microscope', 'microwave', 'milestone', 'milk', 'milk-off',
            'minimize', 'minimize-2', 'minus', 'minus-circle', 'minus-square', 'monitor',
            'monitor-check', 'monitor-dot', 'monitor-down', 'monitor-off', 'monitor-pause',
            'monitor-play', 'monitor-smartphone', 'monitor-speaker', 'monitor-stop', 'monitor-up',
            'monitor-x', 'moon', 'moon-star', 'more-horizontal', 'more-vertical', 'mountain',
            'mountain-snow', 'mouse', 'mouse-off', 'mouse-pointer', 'mouse-pointer-2',
            'mouse-pointer-click', 'mouse-pointer-square', 'mouse-pointer-square-dashed', 'move',
            'move-3d', 'move-diagonal', 'move-diagonal-2', 'move-down', 'move-down-left',
            'move-down-right', 'move-horizontal', 'move-left', 'move-right', 'move-up', 'move-up-left',
            'move-up-right', 'move-vertical', 'music', 'music-2', 'music-3', 'music-4', 'navigation',
            'navigation-2', 'navigation-2-off', 'navigation-off', 'network', 'newspaper', 'nfc',
            'notebook', 'notebook-pen', 'notebook-tabs', 'notebook-text', 'notepad-text',
            'notepad-text-dashed', 'npm', 'nut', 'nut-off', 'octagon', 'octagon-alert', 'octagon-pause',
            'octagon-x', 'omega', 'option', 'orbit', 'origami', 'package', 'package-2', 'package-check',
            'package-minus', 'package-open', 'package-plus', 'package-search', 'package-x',
            'paint-bucket', 'paint-roller', 'paintbrush', 'paintbrush-2', 'paintbrush-vertical',
            'palette', 'palmtree', 'panel-bottom', 'panel-bottom-close', 'panel-bottom-dashed',
            'panel-bottom-open', 'panel-left', 'panel-left-close', 'panel-left-dashed',
            'panel-left-open', 'panel-right', 'panel-right-close', 'panel-right-dashed',
            'panel-right-open', 'panel-top', 'panel-top-close', 'panel-top-dashed', 'panel-top-open',
            'panels-left-bottom', 'panels-right-bottom', 'panels-top-left', 'paperclip', 'parentheses',
            'parking-circle', 'parking-circle-off', 'parking-meter', 'parking-square',
            'parking-square-off', 'party-popper', 'pause', 'pause-circle', 'pause-octagon', 'paw-print',
            'pc-case', 'pen', 'pen-line', 'pen-off', 'pen-tool', 'pencil', 'pencil-line', 'pencil-off',
            'pencil-ruler', 'pentagon', 'percent', 'percent-circle', 'percent-diamond', 'percent-square',
            'person-standing', 'phone', 'phone-call', 'phone-forwarded', 'phone-incoming',
            'phone-missed', 'phone-off', 'phone-outgoing', 'pi', 'pi-square', 'piano', 'pickaxe',
            'picture-in-picture', 'picture-in-picture-2', 'pie-chart', 'pig', 'piggy-bank', 'pilcrow',
            'pilcrow-left', 'pilcrow-right', 'pilcrow-square', 'pill', 'pin', 'pin-off', 'pipette',
            'pizza', 'plane', 'plane-landing', 'plane-takeoff', 'play', 'play-circle', 'play-square',
            'plug', 'plug-2', 'plug-zap', 'plug-zap-2', 'plus', 'plus-circle', 'plus-square', 'pocket',
            'pocket-knife', 'podcast', 'pointer', 'pointer-off', 'popcorn', 'popsicle',
            'pound-sterling', 'power', 'power-circle', 'power-off', 'power-square', 'presentation',
            'printer', 'printer-check', 'projector', 'proportions', 'puzzle', 'pyramid', 'qr-code',
            'quote', 'rabbit', 'radar', 'radiation', 'radical', 'radio', 'radio-receiver', 'radio-tower',
            'radius', 'rail-symbol', 'rainbow', 'rat', 'ratio', 'receipt', 'receipt-cent',
            'receipt-euro', 'receipt-indian-rupee', 'receipt-japanese-yen', 'receipt-pound-sterling',
            'receipt-russian-ruble', 'receipt-swiss-franc', 'receipt-text', 'rectangle-ellipsis',
            'rectangle-horizontal', 'rectangle-vertical', 'recycle', 'redo', 'redo-2', 'redo-dot',
            'refresh-ccw', 'refresh-ccw-dot', 'refresh-cw', 'refresh-cw-off', 'refrigerator', 'regex',
            'remove-formatting', 'repeat', 'repeat-1', 'repeat-2', 'replace', 'replace-all', 'reply',
            'reply-all', 'rewind', 'ribbon', 'rocket', 'rocking-chair', 'roller-coaster', 'rotate-3d',
            'rotate-ccw', 'rotate-ccw-square', 'rotate-cw', 'rotate-cw-square', 'route', 'route-off',
            'router', 'rows-2', 'rows-3', 'rows-4', 'rss', 'ruler', 'russian-ruble', 'sailboat',
            'salad', 'sandwich', 'satellite', 'satellite-dish', 'save', 'save-all', 'save-off', 'scale',
            'scale-3d', 'scaling', 'scan', 'scan-barcode', 'scan-eye', 'scan-face', 'scan-line',
            'scan-qr-code', 'scan-search', 'scan-text', 'scatter-chart', 'school', 'scissors',
            'scissors-line-dashed', 'screen-share', 'screen-share-off', 'scroll', 'scroll-text',
            'search', 'search-check', 'search-code', 'search-slash', 'search-x', 'section', 'send',
            'send-horizontal', 'send-to-back', 'separator-horizontal', 'separator-vertical', 'server',
            'server-cog', 'server-crash', 'server-off', 'settings', 'settings-2', 'shapes', 'share',
            'share-2', 'sheet', 'shell', 'shield', 'shield-alert', 'shield-ban', 'shield-check',
            'shield-ellipsis', 'shield-half', 'shield-minus', 'shield-off', 'shield-plus',
            'shield-question', 'shield-x', 'ship', 'ship-wheel', 'shirt', 'shopping-bag',
            'shopping-basket', 'shopping-cart', 'shovel', 'shower-head', 'shrink', 'shrub', 'shuffle',
            'sigma', 'sigma-square', 'signal', 'signal-high', 'signal-low', 'signal-medium',
            'signal-zero', 'signature', 'signpost', 'signpost-big', 'siren', 'skip-back',
            'skip-forward', 'skull', 'slack', 'slash', 'slice', 'sliders', 'sliders-horizontal',
            'sliders-vertical', 'smartphone', 'smartphone-charging', 'smartphone-nfc', 'smile',
            'smile-plus', 'snail', 'snowflake', 'sofa', 'sort-asc', 'sort-desc', 'soup', 'space',
            'spade', 'sparkle', 'sparkles', 'speaker', 'speech', 'spell-check', 'spell-check-2',
            'spline', 'split', 'split-square-horizontal', 'split-square-vertical', 'spray-can',
            'sprout', 'square', 'square-activity', 'square-alert', 'square-arrow-down',
            'square-arrow-down-left', 'square-arrow-down-right', 'square-arrow-left',
            'square-arrow-out-down-left', 'square-arrow-out-down-right', 'square-arrow-out-up-left',
            'square-arrow-out-up-right', 'square-arrow-right', 'square-arrow-up', 'square-arrow-up-left',
            'square-arrow-up-right', 'square-asterisk', 'square-bottom-dashed-scissors',
            'square-chart-gantt', 'square-check', 'square-check-big', 'square-chevron-down',
            'square-chevron-left', 'square-chevron-right', 'square-chevron-up', 'square-code',
            'square-dashed', 'square-dashed-bottom', 'square-dashed-bottom-code', 'square-dashed-kanban',
            'square-dashed-mouse-pointer', 'square-divide', 'square-dot', 'square-equal',
            'square-function', 'square-kanban', 'square-library', 'square-m', 'square-menu',
            'square-minus', 'square-mouse-pointer', 'square-parking', 'square-parking-off', 'square-pen',
            'square-percent', 'square-pi', 'square-pilcrow', 'square-play', 'square-plus', 'square-power',
            'square-radical', 'square-scissors', 'square-sigma', 'square-slash', 'square-split-horizontal',
            'square-split-vertical', 'square-square', 'square-stack', 'square-terminal', 'square-user',
            'square-user-round', 'square-x', 'squircle', 'squirrel', 'stamp', 'star', 'star-half',
            'star-off', 'stars', 'step-back', 'step-forward', 'stethoscope', 'sticker', 'sticky-note',
            'store', 'stretch-horizontal', 'stretch-vertical', 'strikethrough', 'subscript', 'subtitles',
            'sun', 'sun-dim', 'sun-medium', 'sun-moon', 'sun-snow', 'sunrise', 'sunset', 'superscript',
            'swatch-book', 'swiss-franc', 'switch-camera', 'sword', 'swords', 'syringe', 'table',
            'table-2', 'table-cells-merge', 'table-cells-split', 'table-columns-split',
            'table-of-contents', 'table-properties', 'table-rows-split', 'tablet', 'tablet-smartphone',
            'tablets', 'tag', 'tags', 'tally-1', 'tally-2', 'tally-3', 'tally-4', 'tally-5', 'tangent',
            'target', 'telescope', 'tent', 'tent-tree', 'terminal', 'test-tube', 'test-tube-diagonal',
            'test-tubes', 'text', 'text-cursor', 'text-cursor-input', 'text-quote', 'text-search',
            'text-select', 'theater', 'thermometer', 'thermometer-snowflake', 'thermometer-sun',
            'thumbs-down', 'thumbs-up', 'ticket', 'ticket-check', 'ticket-minus', 'ticket-percent',
            'ticket-plus', 'ticket-slash', 'ticket-x', 'tickets', 'tickets-plane', 'timer', 'timer-off',
            'timer-reset', 'toggle-left', 'toggle-right', 'toilet', 'tornado', 'torus', 'touchpad',
            'touchpad-off', 'tower-control', 'toy-brick', 'tractor', 'traffic-cone', 'train-front',
            'train-front-tunnel', 'train-track', 'tram-front', 'trash', 'trash-2', 'tree-deciduous',
            'tree-palm', 'tree-pine', 'trees', 'trello', 'trending-down', 'trending-up',
            'trending-up-down', 'triangle', 'triangle-alert', 'triangle-right', 'trophy', 'truck',
            'turtle', 'tv', 'tv-2', 'tv-minimal', 'tv-minimal-play', 'twitch', 'twitter', 'type',
            'type-outline', 'umbrella', 'umbrella-off', 'underline', 'undo', 'undo-2', 'undo-dot',
            'unfold-horizontal', 'unfold-vertical', 'ungroup', 'university', 'unlink', 'unlink-2',
            'unplug', 'upload', 'upload-cloud', 'usb', 'user', 'user-check', 'user-circle', 'user-cog',
            'user-minus', 'user-pen', 'user-plus', 'user-round', 'user-round-check', 'user-round-cog',
            'user-round-minus', 'user-round-pen', 'user-round-plus', 'user-round-search',
            'user-round-x', 'user-search', 'user-x', 'users', 'users-round', 'utensils',
            'utensils-crossed', 'utility-pole', 'variable', 'vegan', 'venetian-mask', 'vibrate',
            'vibrate-off', 'video', 'video-off', 'videotape', 'view', 'voicemail', 'volume', 'volume-1',
            'volume-2', 'volume-off', 'volume-x', 'vote', 'wallet', 'wallet-cards', 'wallet-minimal',
            'wallpaper', 'wand', 'wand-sparkles', 'warehouse', 'washing-machine', 'watch', 'waves',
            'waves-ladder', 'waypoints', 'webcam', 'webhook', 'webhook-off', 'weight', 'wheat',
            'wheat-off', 'whole-word', 'wifi', 'wifi-high', 'wifi-low', 'wifi-off', 'wifi-zero', 'wind',
            'wind-arrow-down', 'wine', 'wine-off', 'workflow', 'worm', 'wrap-text', 'wrench', 'x',
            'x-circle', 'x-octagon', 'x-square', 'youtube', 'zap', 'zap-off', 'zoom-in', 'zoom-out'
        ];
    }

    updateSuggestions(): void {
        const query = this.inputEl.value.toLowerCase().trim();

        if (!query) {
            this.closeSuggestions();
            return;
        }

        // Filter icons by matching keywords
        const matches = this.allIcons
            .filter(icon => {
                // Check if any keyword starts with or contains the query
                return icon.keywords.some(keyword =>
                    keyword.toLowerCase().includes(query)
                );
            })
            .slice(0, 20);  // Show max 20 suggestions

        this.showSuggestions(matches);
    }

    showSuggestions(icons: IconItem[]): void {
        this.closeSuggestions();

        if (icons.length === 0) return;

        this.suggestions = document.createElement('div');
        this.suggestions.className = 'suggestion-container';
        this.suggestions.style.cssText = 'position: absolute; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; padding: 4px; z-index: 1000; max-height: 350px; overflow-y: auto;';

        icons.forEach(iconItem => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.style.cssText = 'padding: 6px 10px; cursor: pointer; border-radius: 3px; display: flex; align-items: center; gap: 10px;';

            // Icon/Emoji preview
            const preview = document.createElement('span');
            preview.style.cssText = 'width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 16px;';

            if (iconItem.type === 'emoji') {
                preview.textContent = iconItem.value;
            } else {
                setIcon(preview, iconItem.value);
            }
            item.appendChild(preview);

            // Label
            const textSpan = document.createElement('span');
            if (iconItem.type === 'emoji') {
                textSpan.textContent = iconItem.keywords.join(', ');
                textSpan.style.cssText = 'font-size: 0.9em; color: var(--text-muted);';
            } else {
                textSpan.textContent = iconItem.value;
                textSpan.style.cssText = 'font-family: var(--font-monospace); font-size: 0.85em;';
            }
            item.appendChild(textSpan);

            // Type badge
            const badge = document.createElement('span');
            badge.textContent = iconItem.type;
            badge.style.cssText = `
                margin-left: auto;
                font-size: 0.7em;
                padding: 2px 6px;
                border-radius: 3px;
                background: ${iconItem.type === 'emoji' ? 'var(--color-green)' : 'var(--color-blue)'};
                color: white;
                opacity: 0.7;
            `;
            item.appendChild(badge);

            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--background-modifier-hover)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = '';
            });
            item.addEventListener('click', () => {
                this.inputEl.value = iconItem.value;
                // Store the type in a data attribute BEFORE dispatching input event
                this.inputEl.dataset.iconType = iconItem.type;
                this.inputEl.dispatchEvent(new Event('input'));
                this.updatePreview();
                this.closeSuggestions();
            });
            this.suggestions?.appendChild(item);
        });

        // Add helpful footer note about Lucide library
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 8px 10px;
            margin-top: 4px;
            border-top: 1px solid var(--background-modifier-border);
            font-size: 0.75em;
            color: var(--text-muted);
            text-align: center;
        `;
        footer.innerHTML = '💡 Browse all Lucide icons at <a href="https://lucide.dev/icons/" target="_blank" style="color: var(--text-accent); text-decoration: underline;">lucide.dev/icons</a>';
        this.suggestions?.appendChild(footer);

        const rect = this.inputEl.getBoundingClientRect();
        this.suggestions.style.top = (rect.bottom + 2) + 'px';
        this.suggestions.style.left = rect.left + 'px';
        this.suggestions.style.width = Math.max(rect.width, 300) + 'px';

        document.body.appendChild(this.suggestions);
    }

    updatePreview(): void {
        if (!this.previewEl) return;

        this.previewEl.empty();
        const value = this.inputEl.value.trim();

        if (!value) return;

        // Try to determine if it's an emoji or Lucide icon
        const iconType = this.inputEl.dataset.iconType;

        if (iconType === 'emoji' || value.length <= 2) {
            // It's probably an emoji
            this.previewEl.textContent = value;
            this.previewEl.style.fontSize = '20px';
        } else {
            // It's probably a Lucide icon
            try {
                setIcon(this.previewEl, value);
                this.previewEl.style.fontSize = '';
            } catch (e) {
                // Invalid icon - show question mark
                this.previewEl.textContent = '?';
                this.previewEl.style.fontSize = '16px';
            }
        }
    }

    closeSuggestions(): void {
        if (this.suggestions) {
            this.suggestions.remove();
            this.suggestions = null;
        }
    }
}
